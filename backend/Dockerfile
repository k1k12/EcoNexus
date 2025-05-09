FROM python:3.12-slim

WORKDIR /src

RUN apt-get update && apt-get install -y gcc g++ git libev-dev libffi-dev libssl-dev

COPY . .

RUN pip install --upgrade pip setuptools

RUN pip install -e .[dev]

CMD ["gunicorn", "-k", "uvicorn.workers.UvicornWorker", "main:app", "--workers", "4", "--bind", "0.0.0.0:8000"]
