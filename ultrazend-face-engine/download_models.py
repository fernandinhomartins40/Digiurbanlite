"""Baixa os pesos na construção da imagem (a VPS não depende de internet para subir).

Embutidos: o caminho padrão, todo com licença que permite uso comercial —
BlazeFace + FaceMesh (Google, Apache 2.0), MiniFASNet (Apache 2.0) e AuraFace
(Apache 2.0, SHA-256 conferido). Os ArcFace/MobileFace (uso NÃO comercial) só
são baixados se alguém escolher no painel.
"""
import os

import uniface

uniface.set_cache_dir(os.environ.get("FACE_ENGINE_MODELS_DIR", "/models"))

from app.engine import FaceEngine  # noqa: E402

engine = FaceEngine()  # carrega detector, malha, anti-fraude e o AuraFace (padrão)
print("modelos prontos:", engine.status())
