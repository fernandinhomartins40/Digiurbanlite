"""Motor de leitura de documentos: texto (PaddleOCR PP-OCRv5 latino via RapidOCR)
e códigos (QR/código de barras via ZXing). Só LÊ — quem compara com o cadastro e
decide é o backend (services/doc-reading/rules.ts).

Todos os modelos têm licença que permite uso comercial (Apache 2.0) e são
baixados na construção da imagem com o SHA-256 conferido (download_models.py).
"""

from __future__ import annotations

import base64
import os
import time
from dataclasses import dataclass

import cv2
import numpy as np
import zxingcpp
from rapidocr import LangDet, LangRec, ModelType, OCRVersion, RapidOCR

MODELS_DIR = os.environ.get("DOC_ENGINE_MODELS_DIR", "/models")
THREADS = int(os.environ.get("DOC_ENGINE_THREADS", "2"))
MAX_SIDE = 2000
MAX_BYTES = 12 * 1024 * 1024

# Arquivos esperados (PaddleOCR, Apache 2.0) — conferidos na construção da imagem
MODEL_SHA256 = {
    "ch_PP-OCRv5_det_mobile.onnx": "4d97c44a20d30a81aad087d6a396b08f786c4635742afc391f6621f5c6ae78ae",
    "latin_PP-OCRv5_rec_mobile.onnx": "b20bd37c168a570f583afbc8cd7925603890efbcdc000a59e22c269d160b5f5a",
    "ch_ppocr_mobile_v2.0_cls_mobile.onnx": "e47acedf663230f8863ff1ab0e64dd2d82b838fceb5957146dab185a89d6215c",
}


class EngineError(Exception):
    def __init__(self, message: str, status: int = 400):
        super().__init__(message)
        self.status = status


@dataclass
class _Read:
    lines: list[dict]
    chars: int


def build_ocr() -> RapidOCR:
    return RapidOCR(
        params={
            "Global.log_level": "warning",
            "Global.model_root_dir": MODELS_DIR,
            "Det.ocr_version": OCRVersion.PPOCRV5,
            "Det.lang_type": LangDet.CH,  # o detector de texto do PP-OCRv5 serve para qualquer alfabeto
            "Det.model_type": ModelType.MOBILE,
            "Rec.ocr_version": OCRVersion.PPOCRV5,
            "Rec.lang_type": LangRec.LATIN,  # português, com acentos
            "Rec.model_type": ModelType.MOBILE,
            "EngineConfig.onnxruntime.intra_op_num_threads": THREADS,
            "EngineConfig.onnxruntime.inter_op_num_threads": 1,
        }
    )


def decode_image(data: str) -> np.ndarray:
    if "," in data[:100]:
        data = data.split(",", 1)[1]
    try:
        raw = base64.b64decode(data, validate=False)
    except Exception as error:  # noqa: BLE001
        raise EngineError("Imagem inválida") from error
    if len(raw) > MAX_BYTES:
        raise EngineError("Imagem grande demais", 413)
    image = cv2.imdecode(np.frombuffer(raw, np.uint8), cv2.IMREAD_COLOR)
    if image is None:
        raise EngineError("Não foi possível abrir a imagem")
    h, w = image.shape[:2]
    scale = MAX_SIDE / max(h, w)
    if scale < 1:
        image = cv2.resize(image, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_AREA)
    return image


class DocEngine:
    def __init__(self) -> None:
        self.ocr = build_ocr()
        self.ready_at = time.time()

    def status(self) -> dict:
        present = {name: os.path.exists(os.path.join(MODELS_DIR, name)) for name in MODEL_SHA256}
        return {"models": present, "threads": THREADS}

    def _ocr(self, image: np.ndarray) -> _Read:
        result = self.ocr(image)
        lines = []
        for text, score, box in zip(result.txts or (), result.scores or (), result.boxes if result.boxes is not None else ()):
            text = str(text).strip()
            if not text:
                continue
            ys = [float(point[1]) for point in box]
            xs = [float(point[0]) for point in box]
            lines.append({"text": text, "score": round(float(score), 3), "x": round(min(xs)), "y": round(min(ys))})
        # ordem de leitura: de cima para baixo, da esquerda para a direita
        lines.sort(key=lambda line: (line["y"] // 18, line["x"]))
        return _Read(lines=lines, chars=sum(len(line["text"]) for line in lines))

    def read(self, image_b64: str, with_codes: bool = True) -> dict:
        started = time.perf_counter()
        image = decode_image(image_b64)

        best = self._ocr(image)
        rotation = 0
        # pouco texto: a foto pode estar deitada — tenta virada (só nesse caso, custa o dobro)
        if best.chars < 25:
            for angle, code in ((90, cv2.ROTATE_90_CLOCKWISE), (270, cv2.ROTATE_90_COUNTERCLOCKWISE)):
                candidate = self._ocr(cv2.rotate(image, code))
                if candidate.chars > best.chars * 1.5 and candidate.chars >= 25:
                    best, rotation = candidate, angle
                    break

        codes = []
        if with_codes:
            try:
                for barcode in zxingcpp.read_barcodes(image):
                    codes.append({"format": barcode.format.name, "text": barcode.text[:2000]})
            except Exception:  # noqa: BLE001 — código ilegível não derruba a leitura do texto
                pass

        h, w = image.shape[:2]
        return {
            "lines": best.lines[:400],
            "codes": codes[:10],
            "rotation": rotation,
            "width": w,
            "height": h,
            "ms": round((time.perf_counter() - started) * 1000),
        }
