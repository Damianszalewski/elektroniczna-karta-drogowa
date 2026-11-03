# Backend — Elektroniczna Karta Drogowa

Backend korzysta z PostgreSQL. Połączenie ustawiaj przez `DATABASE_URL` — nie wpisuj hasła bazy bezpośrednio w kodzie.

```text
postgresql://postgres:HASLO@localhost:5432/postgres
```

Jeżeli Twoja baza nazywa się `entelli` albo `entelli-bs`, ustaw przed uruchomieniem:

```bash
export DATABASE_URL='postgresql://postgres:admin@localhost:5432/entelli'
```

W Git Bash na Windows możesz uruchomić backend tak:

```bash
cd ~/Desktop/"Karta Drogowa"/BE
export DATABASE_URL='postgresql://postgres:admin@localhost:5432/postgres'
py -m uvicorn main:app --reload --port 8000
```

Tabela PostgreSQL `users.first_name` jest mapowana w API jako pole `name`.

## Dane demonstracyjne

Skrypt tworzy powtarzalny zestaw danych bez usuwania istniejących rekordów: 10 kierowców, 2 osoby logistyki, administratora, 8 pojazdów, 8 tras oraz docelowo 400 kart drogowych z 1–3 kursami.

```bash
cd BE
py seed_demo_data.py
```

Skrypt korzysta z `DATABASE_URL`. Konta demonstracyjne mają hasło `Demo1234!`, a ich adresy kończą się na `@demo.ekd.local`. Ponowne uruchomienie uzupełnia tylko brakującą liczbę kart.

## Bezpieczeństwo i Docker

Endpointy API wymagają JWT. Moduły użytkowników, pojazdów i tras są dostępne tylko dla administratora, a kierowca może obsługiwać wyłącznie własne karty. W produkcji ustaw `APP_ENV=production`, silny `SECRET_KEY`, `CORS_ORIGINS` na dokładny adres frontendu oraz `ALLOWED_HOSTS` na domenę serwera.

Pojazdy nie są fizycznie usuwane. Operacja usunięcia oznacza pojazd jako `wycofany`, dzięki czemu pozostaje on widoczny przy historycznych kartach, ale nie pojawia się przy tworzeniu nowych.

Pełna instrukcja uruchomienia Docker Compose znajduje się w pliku `../DEPLOYMENT.md`.
