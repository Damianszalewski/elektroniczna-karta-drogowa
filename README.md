# Karta Drogowa

Aplikacja do elektronicznej ewidencji kart drogowych.

## Stack

- **Frontend:** React + TypeScript + Vite
- **Backend:** FastAPI + SQLAlchemy
- **Baza danych:** PostgreSQL w Docker Compose
- **Uruchamianie:** Docker / Docker Compose

## Uruchomienie lokalne przez Docker

1. Utwórz lokalny plik środowiskowy:

   ```powershell
   Copy-Item .env.docker.example .env.docker
   ```

2. Ustaw w `.env.docker` własne wartości `POSTGRES_PASSWORD` i `SECRET_KEY`.

3. Uruchom aplikację:

   ```powershell
   docker compose --env-file .env.docker up -d --build
   ```

4. Otwórz [http://localhost:8080](http://localhost:8080).

Status kontenerów i logi:

```powershell
docker compose --env-file .env.docker ps
docker compose --env-file .env.docker logs -f backend
```

Więcej informacji o wdrożeniu znajduje się w [DEPLOYMENT.md](DEPLOYMENT.md).

## Lokalne uruchomienie kontroli CI

Podstawowe kontrole frontendu, backendu i Compose:

```powershell
pwsh -File .\scripts\ci-local.ps1
```

Pełny test ze zbudowaniem i uruchomieniem tymczasowego stosu Docker:

```powershell
pwsh -File .\scripts\ci-local.ps1 -SmokeTest
```

## Struktura projektu

```text
BE/                 FastAPI, modele, schematy i endpointy
FE/                 React, TypeScript i komponenty UI
docker-compose.yml  lokalne środowisko: PostgreSQL + backend + frontend
```

## Plan CI/CD

Projekt będzie rozwijany etapami:

1. uporządkowanie repozytorium Git i bezpieczne sekrety;
2. automatyczne testy i build frontendu oraz backendu w GitHub Actions;
3. budowanie i publikowanie obrazów Docker;
4. wdrożenie na serwer VPS przez Docker Compose;
5. migracje bazy, backup, healthcheck i bezpieczny rollback.

Konfiguracja publikacji obrazów i ręcznego wdrożenia znajduje się w [deploy/README.md](deploy/README.md). Workflow produkcyjny wymaga skonfigurowanego środowiska GitHub `production` i nie uruchamia wdrożenia automatycznie.

## Zasady bezpieczeństwa

- `.env.docker` nie może trafić do repozytorium;
- nie commitujemy haseł, kluczy JWT ani lokalnych baz danych;
- dane demonstracyjne służą wyłącznie do środowiska testowego;
- produkcja powinna działać za HTTPS i reverse proxy.
