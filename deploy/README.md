# Produkcyjne wdrożenie

Ten katalog opisuje wdrożenie obrazów Docker opublikowanych przez GitHub Actions do GHCR.

## Wymagania serwera

- VPS z Linuxem;
- Docker Engine i Docker Compose Plugin;
- domena wskazująca rekordem DNS na adres VPS-a;
- otwarte porty `80`, `443` oraz SSH;
- osobny użytkownik do wdrożeń, bez logowania rootem przez SSH.

## Jednorazowa konfiguracja

1. Utwórz katalog `/opt/karta-drogowa`.
2. Skopiuj `.env.production.example` jako `.env.production` i wpisz własne wartości.
3. Zmień `DOMAIN`, `CORS_ORIGINS` i `ALLOWED_HOSTS` na prawdziwą domenę.
4. Ustaw długie, losowe `POSTGRES_PASSWORD` i `SECRET_KEY`.
5. W `.env.production` ustaw właściciela obrazów GHCR oraz początkowo tag `latest` lub konkretny SHA.
6. Zaloguj serwer do GHCR tokenem technicznym posiadającym wyłącznie `read:packages`:

   ```bash
   echo "$GHCR_READ_TOKEN" | docker login ghcr.io --username OWNER --password-stdin
   ```

   Token nie powinien być przechowywany w repozytorium ani w pliku `.env.production`.

7. Skopiuj `docker-compose.prod.yml` i `Caddyfile` do `/opt/karta-drogowa`.
8. Uruchom pierwszy raz:

   ```bash
   cd /opt/karta-drogowa
   docker compose --env-file .env.production -f docker-compose.prod.yml pull
   docker compose --env-file .env.production -f docker-compose.prod.yml up -d
   ```

Caddy pobierze certyfikat TLS automatycznie, gdy domena będzie już wskazywać na serwer.

## Sekrety GitHub Environment `production`

Utwórz środowisko `production` i dodaj sekrety:

- `DEPLOY_HOST` — adres VPS-a;
- `DEPLOY_USER` — użytkownik wdrożeniowy;
- `DEPLOY_SSH_KEY` — prywatny klucz SSH użytkownika wdrożeniowego;
- `DEPLOY_KNOWN_HOSTS` — wcześniej zweryfikowany wynik `ssh-keyscan -H domena`.

Opcjonalną zmienną środowiska `DEPLOY_PATH` można ustawić na inną ścieżkę niż `/opt/karta-drogowa`.

Workflow `Publish and deploy` najpierw publikuje obrazy do GHCR, a wdrożenie uruchamia dopiero po ręcznym zaznaczeniu `deploy_production`. Sekrety aplikacji pozostają na VPS-ie.

## Backup i rollback

Przed zmianami wykonuj backup PostgreSQL. Wolumen `postgres_data` zawiera dane produkcyjne i nie może być usuwany przez `docker compose down -v`.

Rollback polega na ustawieniu wcześniejszego taga SHA w zmiennych `BACKEND_IMAGE` i `FRONTEND_IMAGE`, a następnie ponownym wykonaniu `docker compose pull` oraz `up -d`.
