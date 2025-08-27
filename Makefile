setup: ## create venv & install
	python -m venv .venv && . .venv/bin/activate && pip install -r requirements.txt

run: ## run api & web
	docker-compose up --build

lint:
	ruff check . || true

format:
	ruff check --fix .

