"""Baixa os modelos na construção da imagem (a VPS não depende de internet para
subir) e confere o SHA-256 de cada um. Modelos: PaddleOCR PP-OCRv5 (detector de
texto e leitor latino) e o classificador de direção do texto — Apache 2.0."""

import hashlib
import os
import sys

from app.engine import MODEL_SHA256, MODELS_DIR, DocEngine

engine = DocEngine()  # o RapidOCR baixa o que faltar em MODELS_DIR

for name, expected in MODEL_SHA256.items():
    path = os.path.join(MODELS_DIR, name)
    if not os.path.exists(path):
        sys.exit(f"modelo ausente: {name}")
    digest = hashlib.sha256(open(path, "rb").read()).hexdigest()
    if digest != expected:
        sys.exit(f"SHA-256 diferente em {name}: {digest}")

print("modelos prontos:", engine.status())
