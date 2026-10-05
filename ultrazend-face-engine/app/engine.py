"""
Motor de análise facial do DigiUrban (UniFace + ONNX Runtime, só CPU).

Recebe imagens já capturadas e devolve MEDIDAS — quem decide (aprovar cadastro,
reconhecer, aceitar prova de vida) é o servidor de face, com as regras e os
limites configurados no painel. Nada é guardado aqui: sem banco, sem disco.
"""

from __future__ import annotations

import base64
import os
import threading
from dataclasses import dataclass

import cv2
import numpy as np
import onnxruntime as ort

# Cada sessão ONNX, por padrão, usa todos os núcleos e fica "girando" à espera
# de trabalho; com 5 modelos carregados elas disputavam a CPU (detecção ia de
# ~100 ms para ~900 ms). Limita threads e desliga a espera ativa — também é o
# certo numa VPS compartilhada. Precisa vir ANTES de importar o uniface.
_THREADS = int(os.environ.get("FACE_ENGINE_THREADS", "2"))
_OriginalSessionOptions = ort.SessionOptions


def _session_options():
    options = _OriginalSessionOptions()
    options.intra_op_num_threads = _THREADS
    options.inter_op_num_threads = 1
    options.add_session_config_entry("session.intra_op.allow_spinning", "0")
    return options


ort.SessionOptions = _session_options  # type: ignore[assignment]

import uniface  # noqa: E402
from uniface import ArcFace, EDifFIQA, HeadPose, MiniFASNet, MobileFace, RetinaFace  # noqa: E402
from uniface.constants import ArcFaceWeights, MobileFaceWeights, RetinaFaceWeights  # noqa: E402

MODELS_DIR = os.environ.get("FACE_ENGINE_MODELS_DIR", "/models")
MAX_SIDE = int(os.environ.get("FACE_ENGINE_MAX_SIDE", "960"))
MAX_IMAGE_BYTES = int(os.environ.get("FACE_ENGINE_MAX_IMAGE_BYTES", str(4 * 1024 * 1024)))

# Modelos de reconhecimento que o painel pode escolher. Atenção à licença dos
# PESOS (não do código): ver docs/LGPD-RIPD-BIOMETRIA-FACIAL.md.
RECOGNIZERS = {
    "arcface_mnet": lambda: ArcFace(model_name=ArcFaceWeights.MNET),
    "arcface_resnet": lambda: ArcFace(model_name=ArcFaceWeights.RESNET),
    "mobileface_v3l": lambda: MobileFace(model_name=MobileFaceWeights.MNET_V3_LARGE),
}
DEFAULT_RECOGNIZER = os.environ.get("FACE_ENGINE_DEFAULT_MODEL", "arcface_mnet")


class EngineError(Exception):
    def __init__(self, message: str, status: int = 400):
        super().__init__(message)
        self.status = status


def _decode_image(data: str) -> np.ndarray:
    if not isinstance(data, str) or not data:
        raise EngineError("Imagem ausente")
    if data.startswith("data:"):
        data = data.split(",", 1)[-1]
    try:
        raw = base64.b64decode(data, validate=False)
    except Exception as exc:  # noqa: BLE001
        raise EngineError("Imagem inválida") from exc
    if len(raw) > MAX_IMAGE_BYTES:
        raise EngineError("Imagem grande demais")
    image = cv2.imdecode(np.frombuffer(raw, dtype=np.uint8), cv2.IMREAD_COLOR)
    if image is None:
        raise EngineError("Não foi possível ler a imagem")
    height, width = image.shape[:2]
    scale = MAX_SIDE / max(height, width)
    if scale < 1:
        image = cv2.resize(image, (int(width * scale), int(height * scale)), interpolation=cv2.INTER_AREA)
    return image


@dataclass
class _Models:
    detector: RetinaFace
    spoof: MiniFASNet
    quality: EDifFIQA
    pose: HeadPose


class FaceEngine:
    """Carrega os modelos uma vez; chamadas são serializadas por modelo (ONNX é thread-safe,
    mas limitamos a concorrência para não estourar a CPU da VPS compartilhada)."""

    def __init__(self) -> None:
        uniface.set_cache_dir(MODELS_DIR)
        self._lock = threading.Lock()
        self._models = _Models(
            detector=RetinaFace(model_name=RetinaFaceWeights.MNET_V2, confidence_threshold=0.6),
            spoof=MiniFASNet(),
            quality=EDifFIQA(),
            pose=HeadPose(),
        )
        self._recognizers: dict[str, object] = {}
        self.recognizer(DEFAULT_RECOGNIZER)

    def recognizer(self, name: str | None):
        key = name or DEFAULT_RECOGNIZER
        if key not in RECOGNIZERS:
            raise EngineError(f"Modelo de reconhecimento desconhecido: {key}")
        if key not in self._recognizers:
            self._recognizers[key] = RECOGNIZERS[key]()
        return key, self._recognizers[key]

    def _measure_face(self, image: np.ndarray, face, recognizer, with_quality: bool) -> dict:
        bbox = [float(v) for v in face.bbox[:4]]
        x1, y1, x2, y2 = [int(v) for v in bbox]
        h, w = image.shape[:2]
        crop = image[max(0, y1):min(h, y2), max(0, x1):min(w, x2)]
        landmarks = np.asarray(face.landmarks, dtype=np.float32)

        pose = self._models.pose.estimate(crop) if crop.size else None
        spoof = self._models.spoof.predict(image, face.bbox)
        quality = self._models.quality.predict(image, landmarks).score if with_quality else None
        embedding = recognizer.get_normalized_embedding(image, landmarks).flatten()

        eye_mid = (landmarks[0][0] + landmarks[1][0]) / 2
        eye_dist = max(abs(landmarks[1][0] - landmarks[0][0]), 1.0)

        return {
            "bbox": bbox,
            "detectionScore": float(face.confidence),
            "faceSizeRatio": float((x2 - x1) / max(w, 1)),
            "yaw": float(pose.yaw) if pose else None,
            "pitch": float(pose.pitch) if pose else None,
            # >0: nariz à direita dos olhos NA IMAGEM (pessoa virada para a própria esquerda)
            "noseOffset": float((landmarks[2][0] - eye_mid) / eye_dist),
            "spoof": {"isReal": bool(spoof.is_real), "confidence": float(spoof.confidence)},
            "quality": float(quality) if quality is not None else None,
            "embedding": [round(float(v), 6) for v in embedding],
        }

    def analyze(self, frames: list[str], model: str | None, multi: bool, max_faces: int = 10) -> dict:
        if not frames:
            raise EngineError("Envie pelo menos uma imagem")
        if len(frames) > 5:
            raise EngineError("Máximo de 5 imagens por análise")

        model_key, recognizer = self.recognizer(model)
        results = []
        with self._lock:
            for index, data in enumerate(frames):
                image = _decode_image(data)
                faces = self._models.detector.detect(image)
                faces = sorted(faces, key=lambda f: (f.bbox[2] - f.bbox[0]) * (f.bbox[3] - f.bbox[1]), reverse=True)
                measured = [
                    self._measure_face(image, face, recognizer, with_quality=(index == 0))
                    for face in (faces[:max_faces] if multi else faces[:1])
                ]
                results.append({"facesDetected": len(faces), "faces": measured})

        return {
            "model": {"name": model_key, "provider": "uniface", "version": uniface.__version__},
            "frames": results,
        }

    def status(self) -> dict:
        return {
            "ready": True,
            "provider": "uniface",
            "version": uniface.__version__,
            "defaultModel": DEFAULT_RECOGNIZER,
            "loadedModels": sorted(self._recognizers.keys()),
            "availableModels": sorted(RECOGNIZERS.keys()),
        }
