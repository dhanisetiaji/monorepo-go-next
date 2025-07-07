# Backend commands
.PHONY: backend-dev backend-build backend-test backend-clean

backend-dev:
	cd apps/backend && go run main.go

backend-build:
	cd apps/backend && go build -o bin/main main.go

backend-test:
	cd apps/backend && go test ./...

backend-clean:
	cd apps/backend && rm -rf bin/

backend-deps:
	cd apps/backend && go mod tidy && go mod download

# Frontend commands
.PHONY: web-dev web-build web-test web-clean

web-dev:
	cd apps/web && npm run dev

web-build:
	cd apps/web && npm run build

web-test:
	cd apps/web && npm run test

web-clean:
	cd apps/web && npm run clean

# Database commands
.PHONY: db-up db-down db-reset

db-up:
	docker-compose -f docker-compose.dev.yml up -d postgres-dev

db-down:
	docker-compose -f docker-compose.dev.yml down

db-reset:
	docker-compose -f docker-compose.dev.yml down -v
	docker-compose -f docker-compose.dev.yml up -d postgres-dev

# Root commands
.PHONY: install dev build clean dev-parallel dev-with-db

install:
	npm install
	cd apps/web && npm install
	cd apps/backend && go mod download

dev:
	npm run dev

dev-with-db:
	$(MAKE) db-up
	sleep 3
	npm run dev

dev-parallel:
	./dev-parallel.sh

build:
	npm run build

clean:
	npm run clean
	$(MAKE) backend-clean

# Development shortcuts
.PHONY: start-backend start-web

start-backend:
	$(MAKE) backend-dev

start-web:
	$(MAKE) web-dev
