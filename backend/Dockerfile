FROM python:3.12-slim

WORKDIR /src

ENV PYTHONPATH=/src/src:/src \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

COPY . .

RUN pip install --no-cache-dir --upgrade pip setuptools \
    && pip install --no-cache-dir .

# Don't run the server as root
RUN useradd --create-home app && chmod +x start.sh
USER app

EXPOSE 8000

CMD ["./start.sh"]
