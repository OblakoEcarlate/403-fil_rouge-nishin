# Makefile

PROJECT_NAME=laravel-docker

.PHONY: init build up down logs bash fix-perms clean

# =========================
# 🧰 Initialisation locale
# =========================
init:
	@echo "📁 Création de l'arborescence Laravel..."
	@mkdir -p storage/logs storage/framework/cache storage/framework/sessions storage/framework/views bootstrap/cache
	@touch storage/logs/laravel.log
	@chmod -R 775 storage bootstrap
	@echo "✅ Dossiers prêts."
	@echo "📁 Initialisation des dépendances..."
	@composer install
	@echo "✅ Dépendances prêtes."

# =========================
# 🐳 Docker workflow
# =========================
build:
	@echo "🔨 Build de l'image Docker..."
	@docker compose build --no-cache

up:
	@echo "🚀 Démarrage des services..."
	@docker compose up -d

down:
	@echo "🛑 Arrêt et suppression des conteneurs..."
	@docker compose down

logs:
	@docker compose logs -f app

bash:
	@docker exec -it api sh

clean:
	@echo "🧽 Nettoyage complet (containers + volumes)..."
	@docker compose down -v

reset:
	@echo "🧹 Réinitialisation complète du projet..."
	@docker compose down -v --remove-orphans
	@rm -rf storage bootstrap/cache vendor
	@echo "✅ Projet nettoyé. Relance 'make init' pour repartir propre."
