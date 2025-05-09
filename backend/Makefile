include .env

.PHONY: install run test test_man format populate clear secure stress

ifeq ($(OS),Windows_NT)
	PYTHONPATH_SET = set PYTHONPATH=. && 
else
	PYTHONPATH_SET = PYTHONPATH=.
endif


OPEN_CMD := $(shell \
	if command -v open >/dev/null; then echo "open"; \
	elif command -v xdg-open >/dev/null; then echo "xdg-open"; \
	elif command -v start >/dev/null; then echo "start"; \
	else echo "echo 'Please open the report manually:'"; fi \
)

install:
	pip install -e .[dev]

docker:
	docker compose up --build

format:
	black src main.py

populate:
	python tests/manual/db/populate_tables.py

clear:
	python tests/manual/db/clear_tables_data.py

seed:
	python -m app.scripts.seed_db

run:
	uvicorn main:app --reload

make run2:
	gunicorn -k uvicorn.workers.UvicornWorker app.main:app --workers 4

test:
	@$(PYTHONPATH_SET) pytest -q tests/pytest

test_man:
	make populate && \
	make seed && \
	chmod +x tests/manual/scripts/create_update_delete.sh && \
	chmod +x tests/manual/scripts/rp_get.sh && \
	chmod +x tests/manual/scripts/product_get.sh && \
	chmod +x tests/manual/scripts/product_get_unseeded.sh && \
	./tests/manual/scripts/create_update_delete.sh && \
	./tests/manual/scripts/rp_get.sh && \
	./tests/manual/scripts/product_get.sh
	./tests/manual/scripts/product_get_unseeded.sh

secure:
	bandit -r . --exclude ./tests,./venv,./alembic -f html -o tests/bandit/bandit_report.html
	python -c "import webbrowser, pathlib; webbrowser.open(pathlib.Path('tests/bandit/bandit_report.html').resolve().as_uri())"

stress:
	make populate
	locust -f tests/locust/locustfile.py --headless -u 50 -r 20 --host http://localhost:8000 --run-time 60s --html tests/locust/locust_report.html
	python -c "import webbrowser, pathlib; webbrowser.open(pathlib.Path('tests/locust/locust_report.html').resolve().as_uri())"

