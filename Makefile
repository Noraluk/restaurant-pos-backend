.PHONY: help up down build rebuild restart ps logs api-logs db-logs clean db-reset health npm-install typecheck app-build migrate-run migrate-revert migrate-generate

help:
	@printf "%s\n" \
	"Targets:" \
	"  up               docker compose up -d" \
	"  down             docker compose down" \
	"  build            docker compose build" \
	"  rebuild          docker compose build --no-cache" \
	"  restart          docker compose restart" \
	"  ps               docker compose ps" \
	"  logs             docker compose logs -f --tail=200" \
	"  api-logs         docker compose logs -f --tail=200 api" \
	"  db-logs          docker compose logs -f --tail=200 db" \
	"  health           curl http://localhost:3000/health" \
	"  migrate-run      run TypeORM migrations" \
	"  migrate-revert   revert last TypeORM migration" \
	"  migrate-generate generate TypeORM migration (NAME=...)" \
	"  db-reset         drop volumes then up" \
	"  npm-install      npm install" \
	"  typecheck        npm run typecheck" \
	"  app-build        npm run build"

up:
	docker compose up -d

down:
	docker compose down

build:
	docker compose build

rebuild:
	docker compose build --no-cache

restart:
	docker compose restart

ps:
	docker compose ps

logs:
	docker compose logs -f --tail=200

api-logs:
	docker compose logs -f --tail=200 api

db-logs:
	docker compose logs -f --tail=200 db

clean:
	docker compose down --remove-orphans

db-reset:
	docker compose down -v --remove-orphans
	docker compose up -d --build

migrate-run:
	docker compose exec -T api sh -lc "npm run migration:run"

migrate-revert:
	docker compose exec -T api sh -lc "npm run migration:revert"

migrate-generate:
	@test -n "$(NAME)" || (echo "NAME is required, example: make migrate-generate NAME=AddOrdersTable" && exit 1)
	docker compose exec -T api sh -lc "npm run migration:generate -- src/migrations/$(NAME)"
