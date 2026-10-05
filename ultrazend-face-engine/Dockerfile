# Motor facial (UniFace + ONNX Runtime em CPU). Sem porta publicada: só a rede
# interna do Docker o alcança (o servidor de face chama http://ultrazend-face-engine:8000).
FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    FACE_ENGINE_MODELS_DIR=/models \
    OMP_NUM_THREADS=2

WORKDIR /srv

COPY requirements.txt .
# opencv "headless": sem dependências gráficas do sistema (libGL), imagem menor
RUN pip install -r requirements.txt \
 && pip uninstall -y opencv-python \
 && pip install opencv-python-headless==4.10.0.84

COPY app ./app
COPY download_models.py .
RUN python download_models.py && useradd --system --uid 10001 engine && chown -R engine /models

USER engine
EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD python -c "import urllib.request,sys; sys.exit(0 if urllib.request.urlopen('http://127.0.0.1:8000/health', timeout=5).status == 200 else 1)"

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]
