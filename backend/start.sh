#!/bin/sh
# Start command for the live server: migrate, top up the demo data, then serve.
set -e

alembic upgrade head
python -m app.scripts.seed_demo

# Render sets PORT. WEB_CONCURRENCY keeps the worker count low enough for a free instance.
exec gunicorn main:app \
    -k uvicorn.workers.UvicornWorker \
    --workers "${WEB_CONCURRENCY:-2}" \
    --bind "0.0.0.0:${PORT:-8000}" \
    --forwarded-allow-ips "*"
