# Wdrożenie Karty Drogowej przez Docker

## 1. Przygotowanie sekretów

Skopiuj `.env.docker.example` do `.env.docker` i ustaw długie, losowe wartości dla `POSTGRES_PASSWORD` oraz `SECRET_KEY`.
Nie umieszczaj tego pliku w repozytorium.

Przykład wygenerowania sekretu w PowerShell:

```powershell
python -c "import secrets; print(secrets.token_urlsafe(48))"
```

## 2. Uruchomienie

Z katalogu projektu:

```powershell
docker compose --env-file .env.docker up -d --build
```

Aplikacja będzie dostępna pod `http://localhost:8080`. Backend jest dostępny dla frontendu przez `/api`, a PostgreSQL nie jest wystawiony bezpośrednio na hosta.

Ten wariant korzysta z własnego wolumenu PostgreSQL. Jeśli używasz już zewnętrznej bazy, ustaw `DATABASE_URL` w `.env.docker`; backend połączy się z podanym adresem zamiast z bazą kontenera.

Logi:

```powershell
docker compose --env-file .env.docker logs -f backend
```

Zatrzymanie bez usuwania danych:

```powershell
docker compose --env-file .env.docker down
```

Usunięcie również wolumenu bazy jest operacją destrukcyjną — wykonuj je dopiero po wykonaniu backupu:

```powershell
docker compose --env-file .env.docker down -v
```

## 3. Dane demonstracyjne

Seed nie uruchamia się automatycznie w produkcji. Jeśli potrzebujesz danych testowych, wykonaj go jednorazowo w kontenerze backendu:

```powershell
docker compose --env-file .env.docker exec backend python seed_demo_data.py
```

Przed wdrożeniem produkcyjnym nie używaj kont demonstracyjnych ani hasła `Demo1234!`.

## 4. Serwer publiczny

Na VPS ustaw domenę i HTTPS przed udostępnieniem aplikacji. Najprościej postawić reverse proxy (np. Caddy albo Nginx) przed portem `8080`, skonfigurować certyfikat TLS i ustawić:

- `CORS_ORIGINS` na dokładny adres aplikacji, np. `https://karta.example.pl`;
- `ALLOWED_HOSTS` na domenę serwera;
- silne, unikalne `POSTGRES_PASSWORD` i `SECRET_KEY`;
- regularny backup wolumenu PostgreSQL.

Nie wystawiaj portu PostgreSQL do internetu.

## Audyt bezpieczeństwa wykonany lokalnie

- zabezpieczono endpointy JWT i dodano kontrolę ról;
- kierowca może czytać, tworzyć, edytować i usuwać wyłącznie własne karty;
- usunięcie pojazdu jest bezpiecznym wycofaniem (`wycofany`), bez kasowania rekordu używanego przez archiwalne karty;
- moduły użytkowników, pojazdów i tras wymagają administratora;
- zmiana własnego hasła ma osobny endpoint;
- usunięto klucz JWT z kodu produkcyjnego — jest pobierany z `SECRET_KEY`;
- dodano ograniczenie CORS, Trusted Hosts, nagłówki bezpieczeństwa i endpoint `/health`;
- dodano limity długości i zakresów danych wejściowych;
- obrazy Docker nie kopiują lokalnych baz SQLite ani plików `.env`;
- frontend otrzymał CSP i reverse proxy `/api`.

## Pozostałe zalecenia przed produkcją

Obecna aplikacja tworzy/migruje schemat przy starcie przez SQLAlchemy. Dla regularnego rozwoju warto wprowadzić Alembic i wykonywać migracje jako osobny krok wdrożenia. Warto też dodać testy integracyjne RBAC oraz limitowanie prób logowania na reverse proxy.
