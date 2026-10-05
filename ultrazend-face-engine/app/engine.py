"""
Motor de análise facial do DigiUrban (UniFace + ONNX Runtime, só CPU).

Recebe imagens já capturadas e devolve MEDIDAS — quem decide (aprovar cadastro,
reconhecer, aceitar prova de vida) é o servidor de face, com as regras e os
limites configurados no painel. Nada é guardado aqui: sem banco, sem disco.

Caminho padrão 100% liberado para uso comercial (revisão 2026-10-05):
  BlazeFace (Google/MediaPipe, Apache 2.0)  -> acha o rosto
  FaceMesh  (Google/MediaPipe, Apache 2.0)  -> 468 pontos do rosto (alinhamento e giro)
  AuraFace  (fal.ai, Apache 2.0, treinado com dados comerciais) -> assinatura do rosto
  MiniFASNet (Minivision, Apache 2.0)      -> anti-fraude (foto/tela)
  Giro e qualidade: calculados pela geometria e pela imagem, sem modelo.
Saíram RetinaFace (pesos treinados no WIDER FACE, não comercial), HeadPose
(300W-LP) e eDifFIQA (VGGFace2). Os ArcFace do InsightFace continuam
selecionáveis no painel, marcados como "uso não comercial".
"""

from __future__ import annotations

import base64
import hashlib
import math
import os
import threading
import urllib.request

import cv2
import numpy as np
import onnxruntime as ort

# Cada sessão ONNX, por padrão, usa todos os núcleos e fica "girando" à espera
# de trabalho; com vários modelos carregados elas disputavam a CPU (detecção ia
# de ~100 ms para ~900 ms). Limita threads e desliga a espera ativa — também é
# o certo numa VPS compartilhada. Precisa vir ANTES de importar o uniface.
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
from uniface import ArcFace, BlazeFace, FaceMesh, MiniFASNet, MobileFace  # noqa: E402
from uniface.constants import ArcFaceWeights, MobileFaceWeights  # noqa: E402
from uniface.face_utils import face_alignment  # noqa: E402
from uniface.recognition.base import BaseRecognizer, PreprocessConfig  # noqa: E402

MODELS_DIR = os.environ.get("FACE_ENGINE_MODELS_DIR", "/models")
MAX_SIDE = int(os.environ.get("FACE_ENGINE_MAX_SIDE", "960"))
MAX_IMAGE_BYTES = int(os.environ.get("FACE_ENGINE_MAX_IMAGE_BYTES", str(4 * 1024 * 1024)))

# AuraFace v1 (https://huggingface.co/fal/AuraFace-v1) — versão fixada + SHA-256
AURAFACE_URL = (
    "https://huggingface.co/fal/AuraFace-v1/resolve/"
    "af6d057c9b0ec4071d4c49c80e3539258798b609/glintr100.onnx"
)
AURAFACE_SHA256 = "a7933ea5330113b01c9b60351d8f4c33003f145d8470ac5f0e52ee2effe25c60"


def _sha256(path: str) -> str:
    digest = hashlib.sha256()
    with open(path, "rb") as handle:
        for chunk in iter(lambda: handle.read(1 << 20), b""):
            digest.update(chunk)
    return digest.hexdigest()


def ensure_auraface() -> str:
    """Caminho do AuraFace; baixa (e confere o SHA-256) se ainda não estiver no disco."""
    path = os.path.join(MODELS_DIR, "auraface", "glintr100.onnx")
    if os.path.exists(path) and _sha256(path) == AURAFACE_SHA256:
        return path
    os.makedirs(os.path.dirname(path), exist_ok=True)
    temp = path + ".download"
    urllib.request.urlretrieve(AURAFACE_URL, temp)
    if _sha256(temp) != AURAFACE_SHA256:
        os.remove(temp)
        raise RuntimeError("AuraFace baixado não confere com o SHA-256 esperado")
    os.replace(temp, path)
    return path


class AuraFace(BaseRecognizer):
    """AuraFace (ResNet100, 512 números) no reconhecedor-base do UniFace."""

    def __init__(self) -> None:
        super().__init__(
            model_path=ensure_auraface(),
            preprocessing=PreprocessConfig(input_mean=127.5, input_std=127.5, input_size=(112, 112)),
        )


# Modelos que o painel pode escolher. Licença dos PESOS no painel e em
# docs/LGPD-RIPD-BIOMETRIA-FACIAL.md.
RECOGNIZERS = {
    "auraface": AuraFace,
    "arcface_mnet": lambda: ArcFace(model_name=ArcFaceWeights.MNET),
    "arcface_resnet": lambda: ArcFace(model_name=ArcFaceWeights.RESNET),
    "mobileface_v3l": lambda: MobileFace(model_name=MobileFaceWeights.MNET_V3_LARGE),
}
DEFAULT_RECOGNIZER = os.environ.get("FACE_ENGINE_DEFAULT_MODEL", "auraface")

# Pontos da malha (MediaPipe, 468) usados para os 5 pontos de alinhamento do ArcFace
_EYE_LEFT_IMG = (33, 133)  # olho que aparece à esquerda na imagem
_EYE_RIGHT_IMG = (362, 263)  # olho que aparece à direita na imagem
_NOSE_TIP = 1
_MOUTH_LEFT_IMG = 61
_MOUTH_RIGHT_IMG = 291


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


def five_points(mesh: np.ndarray) -> np.ndarray:
    points = mesh[:, :2]
    return np.array(
        [
            points[list(_EYE_LEFT_IMG)].mean(axis=0),
            points[list(_EYE_RIGHT_IMG)].mean(axis=0),
            points[_NOSE_TIP],
            points[_MOUTH_LEFT_IMG],
            points[_MOUTH_RIGHT_IMG],
        ],
        dtype=np.float32,
    )


def yaw_from_mesh(mesh: np.ndarray) -> float:
    """
    Giro do rosto em graus pela profundidade dos cantos externos dos olhos.
    Convenção: negativo = pessoa virada para a PRÓPRIA esquerda (igual ao modelo
    de pose usado antes; conferido em fotos reais, diferença de 2 a 9 graus).
    """
    left, right = mesh[33], mesh[263]
    return -math.degrees(math.atan2(right[2] - left[2], right[0] - left[0]))


def pitch_from_mesh(mesh: np.ndarray) -> float:
    top, bottom = mesh[10], mesh[152]  # testa e queixo
    return math.degrees(math.atan2(bottom[2] - top[2], bottom[1] - top[1]))


def quality_score(aligned: np.ndarray, detection_score: float, face_width_px: float) -> float:
    """
    Qualidade da foto de cadastro sem modelo treinado (0 a 1). Substitui o
    eDifFIQA (treinado no VGGFace2). Calibrado em 2026-10-05: foto nítida e bem
    iluminada ~0,85-0,95; desfoque forte ~0,49; foto escura ~0,25 (mínimo padrão 0,55).
    """
    gray = cv2.cvtColor(aligned, cv2.COLOR_BGR2GRAY)
    sharpness = min(cv2.Laplacian(gray, cv2.CV_64F).var() / 500.0, 1.0)
    brightness = 1.0 - min(abs(float(gray.mean()) - 130.0) / 100.0, 1.0)
    size = min(face_width_px / 140.0, 1.0)
    confidence = min(max(float(detection_score), 0.0), 1.0)
    score = (0.6 * sharpness + 0.4 * brightness) * (0.7 + 0.3 * size) * (0.85 + 0.15 * confidence)
    return round(float(score), 4)


class FaceEngine:
    """Carrega os modelos uma vez; as chamadas são serializadas para não estourar a CPU da VPS."""

    def __init__(self) -> None:
        uniface.set_cache_dir(MODELS_DIR)
        self._lock = threading.Lock()
        self.detector = BlazeFace(confidence_threshold=0.6)
        self.mesh = FaceMesh()
        self.spoof = MiniFASNet()
        self._recognizers: dict[str, object] = {}
        self.recognizer(DEFAULT_RECOGNIZER)

    def recognizer(self, name: str | None):
        key = name or DEFAULT_RECOGNIZER
        if key not in RECOGNIZERS:
            raise EngineError(f"Modelo de reconhecimento desconhecido: {key}")
        if key not in self._recognizers:
            self._recognizers[key] = RECOGNIZERS[key]()
        return key, self._recognizers[key]

    def _measure_face(self, image: np.ndarray, face, recognizer, with_quality: bool) -> dict | None:
        bbox = [float(v) for v in face.bbox[:4]]
        x1, _, x2, _ = bbox
        width = image.shape[1]
        meshes = self.mesh.predict(image, [face])
        if not meshes:
            return None
        mesh = np.asarray(meshes[0].landmarks, dtype=np.float32)
        landmarks = five_points(mesh)

        embedding = recognizer.get_normalized_embedding(image, landmarks).flatten()
        spoof = self.spoof.predict(image, face.bbox)
        quality = None
        if with_quality:
            aligned, _ = face_alignment(image, landmarks, image_size=(112, 112))
            quality = quality_score(aligned, float(face.confidence), x2 - x1)

        eye_mid = (landmarks[0][0] + landmarks[1][0]) / 2
        eye_dist = max(abs(landmarks[1][0] - landmarks[0][0]), 1.0)

        return {
            "bbox": bbox,
            "detectionScore": float(face.confidence),
            "faceSizeRatio": float((x2 - x1) / max(width, 1)),
            "yaw": round(yaw_from_mesh(mesh), 2),
            "pitch": round(pitch_from_mesh(mesh), 2),
            # >0: nariz à direita dos olhos NA IMAGEM (pessoa virada para a própria esquerda)
            "noseOffset": float((landmarks[2][0] - eye_mid) / eye_dist),
            "spoof": {"isReal": bool(spoof.is_real), "confidence": float(spoof.confidence)},
            "quality": quality,
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
                faces = self.detector.detect(image)
                faces = sorted(faces, key=lambda f: (f.bbox[2] - f.bbox[0]) * (f.bbox[3] - f.bbox[1]), reverse=True)
                measured = [
                    self._measure_face(image, face, recognizer, with_quality=(index == 0))
                    for face in (faces[:max_faces] if multi else faces[:1])
                ]
                results.append({"facesDetected": len(faces), "faces": [item for item in measured if item]})

        return {
            "model": {"name": model_key, "provider": "uniface", "version": uniface.__version__},
            "frames": results,
        }

    def status(self) -> dict:
        return {
            "ready": True,
            "provider": "uniface",
            "version": uniface.__version__,
            "pipeline": "blazeface+facemesh+minifasnet",
            "defaultModel": DEFAULT_RECOGNIZER,
            "loadedModels": sorted(self._recognizers.keys()),
            "availableModels": sorted(RECOGNIZERS.keys()),
        }
