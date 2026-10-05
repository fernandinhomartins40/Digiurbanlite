"""API interna do motor facial. Fica só na rede interna do Docker (sem porta publicada)."""

from __future__ import annotations

import hmac
import os

from fastapi import FastAPI, Header, HTTPException
from fastapi.concurrency import run_in_threadpool
from pydantic import BaseModel, Field

from .engine import EngineError, FaceEngine

app = FastAPI(title="DigiUrban Face Engine", docs_url=None, redoc_url=None, openapi_url=None)
_engine: FaceEngine | None = None
ENGINE_TOKEN = os.environ.get("FACE_ENGINE_TOKEN", "")


def engine() -> FaceEngine:
    global _engine
    if _engine is None:
        _engine = FaceEngine()
    return _engine


@app.on_event("startup")
def _warmup() -> None:
    engine()


def _check_token(token: str | None) -> None:
    # Defesa extra: mesmo dentro da rede interna, exige o token quando configurado
    if ENGINE_TOKEN and not hmac.compare_digest(token or "", f"Bearer {ENGINE_TOKEN}"):
        raise HTTPException(status_code=401, detail="Token inválido")


class AnalyzeRequest(BaseModel):
    frames: list[str] = Field(min_length=1, max_length=5)
    model: str | None = None
    multi: bool = False
    maxFaces: int = Field(default=10, ge=1, le=30)


@app.get("/health")
def health() -> dict:
    return {"status": "ok", **engine().status()}


@app.post("/v1/analyze")
async def analyze(body: AnalyzeRequest, authorization: str | None = Header(default=None)) -> dict:
    _check_token(authorization)
    try:
        return await run_in_threadpool(engine().analyze, body.frames, body.model, body.multi, body.maxFaces)
    except EngineError as error:
        raise HTTPException(status_code=error.status, detail=str(error)) from error
