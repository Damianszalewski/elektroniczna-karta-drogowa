# Elektroniczna Karta Drogowa

System do elektronicznego prowadzenia kart drogowych, ewidencji kursów i zarządzania flotą pojazdów.

[![CI](https://github.com/Damianszalewski/elektroniczna-karta-drogowa/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/Damianszalewski/elektroniczna-karta-drogowa/actions/workflows/ci.yml)

## Najważniejsze funkcje

- tworzenie kart drogowych zawierających wiele kursów;
- archiwum kart z wyszukiwaniem, filtrowaniem po roku i miesiącu oraz paginacją;
- kontrola liczników pojazdów — licznik początkowy jest pobierany z ostatniego odczytu, a końcowy nie może być niższy;
- zarządzanie pojazdami z bezpiecznym wycofaniem zamiast fizycznego usuwania;
- moduł gotowych tras i punktów przejazdu;
- drukowanie karty drogowej oraz zapis do PDF z listą tras na kolejnej stronie;
- role `kierowca`, `logistyka` i `administrator`;
- ograniczenie widoczności kart: kierowca widzi swoje karty, a logistyka i administrator wszystkie;
- jasny i ciemny motyw interfejsu;
- autoryzacja JWT, kontrola uprawnień i podstawowe nagłówki bezpieczeństwa.

## Technologie

| Warstwa | Technologie |
| --- | --- |
| Frontend | React, TypeScript, Vite, Nginx |
| Backend | FastAPI, SQLAlchemy, Uvicorn |
| Baza danych | PostgreSQL |
| Środowisko | Docker, Docker Compose |
| CI/CD | GitHub Actions, GHCR, SSH |
| HTTPS | Caddy |

## Wymagania

Do uruchomienia wariantu Docker potrzebujesz:

- Docker Desktop z Docker Compose;
- Git;
- systemu Windows, Linux lub macOS.

## Uruchomienie lokalne przez Docker

1. Sklonuj repozytorium:

   ```bash
   git clone https://github.com/Damianszalewski/elektroniczna-karta-drogowa.git
   cd elektroniczna-karta-drogowa
   ```

2. Utwórz lokalny plik środowiskowy:

   ```powershell
   Copy-Item .env.docker.example .env.docker
   ```

3. W `.env.docker` ustaw własne, długie wartości `POSTGRES_PASSWORD` i `SECRET_KEY`.

   Sekrety możesz wygenerować w PowerShellu:

   ```powershell
   python -c "import secrets; print(secrets.token_urlsafe(48))"
   ```

4. Uruchom cały stos:

   ```powershell
   docker compose --env-file .env.docker up -d --build
   ```

5. Otwórz aplikację: [http://localhost:8080](http://localhost:8080).

Przydatne polecenia:

```powershell
docker compose --env-file .env.docker ps
docker compose --env-file .env.docker logs -f backend
docker compose --env-file .env.docker down
```

### Dane demonstracyjne

Dane przykładowe są opcjonalne i służą wyłącznie do środowiska lokalnego:

```powershell
docker compose --env-file .env.docker exec backend python seed_demo_data.py
```

Nie uruchamiaj seedowania danych demonstracyjnych na produkcji.

## Kontrole lokalne

Skrypt uruchamia te same podstawowe kontrole, które wykonuje CI:

```powershell
pwsh -File .\scripts\ci-local.ps1
```

Pełny smoke test buduje obrazy, uruchamia PostgreSQL, backend i frontend, a następnie sprawdza odpowiedź API przez reverse proxy:

```powershell
pwsh -File .\scripts\ci-local.ps1 -SmokeTest
```

## Struktura projektu

```text
BE/                         Backend FastAPI
  models/                   Modele SQLAlchemy
  routers/                  Endpointy API
  schemas/                  Walidacja danych wejściowych i odpowiedzi
FE/                         Frontend React + TypeScript
  src/components/           Wspólne komponenty i layout
  src/features/             Moduły funkcjonalne aplikacji
  src/services/             Warstwa komunikacji z API
  src/styles/               Style globalne i tokeny motywu
.github/workflows/          Workflow CI i publikacji/deploymentu
deploy/                     Produkcyjny Compose, Caddy i instrukcja wdrożenia
docker-compose.yml          Lokalne środowisko PostgreSQL + BE + FE
```

## CI/CD

### CI — `.github/workflows/ci.yml`

Workflow uruchamia się dla zmian kierowanych do `main` i wykonuje:

1. typecheck oraz build frontendu;
2. kompilację backendu;
3. walidację konfiguracji Compose;
4. budowę obrazów Docker;
5. smoke test całego stosu z PostgreSQL.

### Publikacja i CD — `.github/workflows/release.yml`

Workflow release:

- buduje obrazy backendu i frontendu;
- publikuje je do GitHub Container Registry;
- może ręcznie wdrożyć konkretny commit na VPS przez SSH;
- korzysta z produkcyjnego Compose i Caddy.

Publikację można uruchomić tagiem wersji:

```bash
git tag v1.0.0
git push origin v1.0.0
```

Wdrożenie produkcyjne wymaga dodatkowego ręcznego uruchomienia z zaznaczeniem `deploy_production` oraz skonfigurowanych sekretów środowiska GitHub `production`.

Szczegółowa instrukcja znajduje się w [deploy/README.md](deploy/README.md), a opis lokalnego i serwerowego uruchomienia w [DEPLOYMENT.md](DEPLOYMENT.md).

## Role i dostęp

| Rola | Dostęp |
| --- | --- |
| Kierowca | własne karty drogowe i operacje dozwolone dla kierowcy |
| Logistyka | wszystkie karty drogowe |
| Administrator | wszystkie karty oraz moduły użytkowników, pojazdów i tras |

Administrator jest osobnym uprawnieniem, a nie zamiennikiem roli podstawowej.

## Konfiguracja środowiska

Najważniejsze zmienne lokalnego pliku `.env.docker`:

| Zmienna | Znaczenie |
| --- | --- |
| `APP_ENV` | tryb aplikacji, lokalnie lub produkcyjnie |
| `APP_PORT` | port frontendu na hoście |
| `POSTGRES_DB` | nazwa bazy |
| `POSTGRES_USER` | użytkownik bazy |
| `POSTGRES_PASSWORD` | hasło bazy |
| `SECRET_KEY` | klucz podpisywania JWT |
| `CORS_ORIGINS` | dozwolone adresy frontendów |
| `ALLOWED_HOSTS` | dozwolone hosty backendu |
| `VITE_API_URL` | adres API używany przez frontend |

Pliki `.env`, lokalne bazy, buildy i zależności nie powinny być commitowane. Do repozytorium trafiają wyłącznie pliki `.env.*.example` bez prawdziwych sekretów.

## Bezpieczeństwo produkcji

- używaj HTTPS i domeny za reverse proxy;
- nie wystawiaj PostgreSQL bezpośrednio do internetu;
- przechowuj sekrety aplikacji na serwerze lub w GitHub Secrets;
- używaj osobnego użytkownika SSH do wdrożeń;
- przed zmianami wykonuj backup wolumenu PostgreSQL;
- nie używaj `docker compose down -v` na produkcji bez świadomego backupu;
- wdrażaj konkretny tag lub SHA, aby rollback był możliwy.

## Status projektu

Lokalny Docker i CI są skonfigurowane. Produkcyjne CD wymaga jeszcze docelowego VPS-a, domeny i sekretów środowiska `production`.
