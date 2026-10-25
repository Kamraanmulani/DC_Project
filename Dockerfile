# =============================================================================
# Distributed Computing Lab - Experiment 10: Kubernetes Multi-Service Image
# Single shared container image packaging all ChessMate distributed microservices
# =============================================================================

FROM python:3.10-slim

WORKDIR /app

# Ensure standard output and error are unbuffered for real-time kubectl logs
ENV PYTHONUNBUFFERED=1
ENV RUN_ENV=docker

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application source code, protos, and compiled stubs
COPY . .

# Default entrypoint runs python
ENTRYPOINT ["python"]
CMD ["chess_server.py"]
