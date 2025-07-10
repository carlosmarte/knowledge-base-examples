# Makefile - Docker/Docker Compose Command Suite

# ------------------------------------------------------------------------------
# Configurable Environment Variables (can be overridden via CLI)
# Example: make build DOCKER_NAME=myapp DOCKER_VERSION=1.2.3
# ------------------------------------------------------------------------------
DOCKER_NAME ?= myapp
DOCKER_VERSION ?= latest

MAKEFILE_NAME := $(lastword $(MAKEFILE_LIST))

.PHONY: help
help:  ## Show this help menu
	@echo "Available Docker Commands (from $(MAKEFILE_NAME)):"; \
	grep -E '^[a-zA-Z0-9_-]+:.*?## .*$$' $(MAKEFILE_NAME) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-25s\033[0m %s\n", $$1, $$2}'

# ------------------------------------------------------------------------------
# Docker Commands
# ------------------------------------------------------------------------------

build:  ## Build Docker image
	docker build -t $(DOCKER_NAME):$(DOCKER_VERSION) .

run:  ## Run Docker container
	docker run --rm -it $(DOCKER_NAME):$(DOCKER_VERSION)

bash:  ## Run bash in Docker container
	docker run --rm -it $(DOCKER_NAME):$(DOCKER_VERSION) /bin/bash

clean:  ## Remove all stopped containers and dangling images
	docker container prune -f
	docker image prune -f

images:  ## List Docker images
	docker images

ps:  ## Show running Docker containers
	docker ps

# ------------------------------------------------------------------------------
# Docker Compose Base
# ------------------------------------------------------------------------------

dc-up:  ## Start services via docker-compose (detached)
	docker-compose up -d

dc-down:  ## Stop and remove docker-compose services
	docker-compose down

dc-restart:  ## Restart docker-compose services
	docker-compose down && docker-compose up -d

dc-logs:  ## View logs from docker-compose
	docker-compose logs -f

dc-build:  ## Build docker-compose services
	docker-compose build

dc-ps:  ## Show docker-compose services
	docker-compose ps

dc-pull:  ## Pull latest images for docker-compose
	docker-compose pull

# Aliases
start: dc-up  ## Alias for dc-up
stop: dc-down ## Alias for dc-down

# ------------------------------------------------------------------------------
# Docker Compose Dynamic Log Utilities (Require explicit args)
# ------------------------------------------------------------------------------

log-name:  ## Show all logs for a service. Usage: make log-name NAME=service
	@if [ -z "$(NAME)" ]; then echo "❌ NAME is required"; exit 1; fi; \
	docker-compose logs $(NAME)

log-tail10:  ## Show last 10 log lines for a service. Usage: make log-tail10 NAME=service
	@if [ -z "$(NAME)" ]; then echo "❌ NAME is required"; exit 1; fi; \
	docker-compose logs $(NAME) --tail=10

log-keyword:  ## Grep keyword in logs with context. Usage: make log-keyword NAME=service KEYWORD=panic
	@if [ -z "$(NAME)" ] || [ -z "$(KEYWORD)" ]; then echo "❌ NAME and KEYWORD are required"; exit 1; fi; \
	docker-compose logs $(NAME) | grep -A5 -B5 "$(KEYWORD)" | tail -20

log-zero:  ## Filter logs for lines with [0]. Usage: make log-zero NAME=service
	@if [ -z "$(NAME)" ]; then echo "❌ NAME is required"; exit 1; fi; \
	docker-compose logs $(NAME) | grep "\[0\]" | tail -10

log-pipe:  ## Filter logs using OR of pipes. Usage: make log-pipe NAME=service PIPE_LIST="error|panic"
	@if [ -z "$(NAME)" ] || [ -z "$(PIPE_LIST)" ]; then echo "❌ NAME and PIPE_LIST are required"; exit 1; fi; \
	docker-compose logs $(NAME) | grep -E "$(PIPE_LIST)" | tail -10

log-wait:  ## Wait 20s then show last 30 logs. Usage: make log-wait NAME=service
	@if [ -z "$(NAME)" ]; then echo "❌ NAME is required"; exit 1; fi; \
	sleep 20 && docker-compose logs $(NAME) --tail=30

dc-restart-name:  ## Restart a specific service. Usage: make dc-restart-name NAME=service
	@if [ -z "$(NAME)" ]; then echo "❌ NAME is required"; exit 1; fi; \
	docker-compose restart $(NAME)

(* make build                          # builds myapp:latest
make build DOCKER_VERSION=2.0.0     # builds myapp:2.0.0
make build DOCKER_NAME=myapi DOCKER_VERSION=2.0.0

make log-keyword NAME=api KEYWORD=panic
make log-pipe NAME=worker PIPE_LIST="error|timeout|disconnect" *)
