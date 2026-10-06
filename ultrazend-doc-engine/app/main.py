"""API interna do motor de leitura de documentos. Só na rede interna do Docker
(sem porta publicada); quem chama é o backend."""

from __future__ import annotations

import hmac
import os

from fastapi import FastAPI, Header, HTTPException
from fastapi.concurrency import run_in_threadpool
from pydantic import BaseModel, Field

from .engine import DocEngine, EngineError

app = FastAPI(title="DigiUrban Doc Engine", docs_url=None, redoc_url=None, openapi_url=None)
_engine: DocEngine | None = None
ENGINE_TOKEN = os.environ.get("DOC_ENGINE_TOKEN", "")


def engine() -> DocEngine:
    global _engine
    if _engine is None:
        _engine = DocEngine()
    return _engine


@app.on_event("startup")
def _warmup() -> None:
    engine()


def _check_token(token: str | None) -> None:
    if ENGINE_TOKEN and not hmac.compare_digest(token or "", f"Bearer {ENGINE_TOKEN}"):
        raise HTTPException(status_code=401, detail="Token inválido")


class ReadRequest(BaseModel):
    image: str = Field(min_length=100, max_length=17_000_000)
    codes: bool = True


@app.get("/health")
def health() -> dict:
    return {"status": "ok", **engine().status()}


@app.post("/v1/read")
async def read(body: ReadRequest, authorization: str | None = Header(default=None)) -> dict:
    _check_token(authorization)
    try:
        return await run_in_threadpool(engine().read, body.image, body.codes)
    except EngineError as error:
        raise HTTPException(status_code=error.status, detail=str(error)) from error
