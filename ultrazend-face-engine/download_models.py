"""Baixa os pesos na construção da imagem (a VPS não depende de internet para subir).

Só os modelos leves vão embutidos; o ArcFace grande (174 MB) é baixado na
primeira vez que for escolhido no painel — a VPS tem pouco disco.
"""
import os

import uniface

uniface.set_cache_dir(os.environ.get("FACE_ENGINE_MODELS_DIR", "/models"))

from app.engine import FaceEngine  # noqa: E402

engine = FaceEngine()
for name in ("arcface_mnet", "mobileface_v3l"):
    engine.recognizer(name)
print("modelos prontos:", engine.status())
