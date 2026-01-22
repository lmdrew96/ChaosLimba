FROM runpod/pytorch:2.0.1-py3.10-cuda11.8.0-devel

# Install dependencies
RUN pip install --no-cache-dir \
    transformers \
    torchaudio \
    runpod \
    soundfile

# Copy your handler
COPY pronunciation_handler.py /app/handler.py

# Set working directory
WORKDIR /app

# RunPod will execute this
CMD ["python", "-u", "handler.py"]