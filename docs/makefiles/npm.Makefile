# Makefile - Node.js / NPM Workspace Command Suite

# ------------------------------------------------------------------------------
# Configurable Environment Variables (override via CLI)
# ------------------------------------------------------------------------------
NODE_ENV ?= development
NPM_COMMAND ?= npm
PKG ?= ""  # workspace package name (e.g., @app/web)

MAKEFILE_NAME := $(lastword $(MAKEFILE_LIST))

.PHONY: help
help:  ## Show this help menu
	@echo "Available NPM/Node Commands (from $(MAKEFILE_NAME)):"; \
	grep -E '^[a-zA-Z0-9_-]+:.*?## .*$$' $(MAKEFILE_NAME) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-25s\033[0m %s\n", $$1, $$2}'

# ------------------------------------------------------------------------------
# Project-level Commands
# ------------------------------------------------------------------------------

install:  ## Install root dependencies
	$(NPM_COMMAND) install

clean:  ## Remove node_modules and build artifacts
	rm -rf node_modules dist .turbo .next

reinstall: clean install  ## Reinstall all dependencies cleanly

build:  ## Build the entire project
	NODE_ENV=$(NODE_ENV) $(NPM_COMMAND) run build

dev:  ## Start the root project in development mode
	NODE_ENV=$(NODE_ENV) $(NPM_COMMAND) run dev

test:  ## Run all tests
	NODE_ENV=$(NODE_ENV) $(NPM_COMMAND) test

lint:  ## Run linter
	$(NPM_COMMAND) run lint

typecheck:  ## Run TypeScript type checking
	$(NPM_COMMAND) run typecheck

start:  ## Start project in production
	NODE_ENV=production $(NPM_COMMAND) start

# ------------------------------------------------------------------------------
# Workspace Commands (Require PKG)
# ------------------------------------------------------------------------------

ws-build:  ## Build a specific workspace package. Usage: make ws-build PKG=@app/web
	@if [ -z "$(PKG)" ]; then echo "❌ PKG is required"; exit 1; fi; \
	NODE_ENV=$(NODE_ENV) $(NPM_COMMAND) --workspace $(PKG) run build

ws-dev:  ## Start a specific workspace in dev mode. Usage: make ws-dev PKG=@app/web
	@if [ -z "$(PKG)" ]; then echo "❌ PKG is required"; exit 1; fi; \
	NODE_ENV=$(NODE_ENV) $(NPM_COMMAND) --workspace $(PKG) run dev

ws-test:  ## Run tests in a specific workspace. Usage: make ws-test PKG=@app/web
	@if [ -z "$(PKG)" ]; then echo "❌ PKG is required"; exit 1; fi; \
	NODE_ENV=$(NODE_ENV) $(NPM_COMMAND) --workspace $(PKG) run test

ws-lint:  ## Lint a specific workspace. Usage: make ws-lint PKG=@app/web
	@if [ -z "$(PKG)" ]; then echo "❌ PKG is required"; exit 1; fi; \
	$(NPM_COMMAND) --workspace $(PKG) run lint

ws-typecheck:  ## Type check a specific workspace. Usage: make ws-typecheck PKG=@app/web
	@if [ -z "$(PKG)" ]; then echo "❌ PKG is required"; exit 1; fi; \
	$(NPM_COMMAND) --workspace $(PKG) run typecheck

ws-script:  ## Run any script in a workspace. Usage: make ws-script PKG=@app/web SCRIPT=build
	@if [ -z "$(PKG)" ] || [ -z "$(SCRIPT)" ]; then echo "❌ PKG and SCRIPT are required"; exit 1; fi; \
	NODE_ENV=$(NODE_ENV) $(NPM_COMMAND) --workspace $(PKG) run $(SCRIPT)

# # Project-level
# make install
# make build NODE_ENV=production
# make test
# make clean

# # Workspace-level
# make ws-build PKG=@app/web
# make ws-dev PKG=@lib/core
# make ws-script PKG=@app/api SCRIPT=deploy
