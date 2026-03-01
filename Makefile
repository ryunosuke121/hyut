export PATH := $(HOME)/.cargo/bin:$(PATH)

.PHONY: lint lint-frontend lint-backend

lint: lint-frontend lint-backend

lint-frontend:
	npx @biomejs/biome check --write src/

lint-backend:
	cd src-tauri && cargo fmt --all
	cd src-tauri && cargo clippy --all-targets --all-features -- -D warnings
