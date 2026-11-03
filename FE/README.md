# Frontend — Elektroniczna Karta Drogowa

## Struktura

```text
src/
├── App.tsx                    # sesja, nawigacja ekranów i uprawnienia
├── components/
│   ├── layout.tsx              # Header i Sidebar
│   ├── layout.css               # style layoutu aplikacji
│   ├── ui.tsx                  # wspólne kontrolki UI
│   └── ui.css                  # style wspólnych kontrolek
├── features/
│   ├── account/                # zmiana hasła
│   ├── auth/                   # logowanie
│   ├── dashboard/              # panel główny
│   ├── fleet/                  # pojazdy
│   ├── roadCards/              # tworzenie, archiwum i drukowanie kart
│   ├── routes/                 # gotowe trasy
│   └── users/                  # użytkownicy i role
├── hooks/
│   ├── useDeleteConfirmation.ts # wspólny cykl potwierdzania usuwania
│   └── usePagination.ts         # wspólna paginacja list
├── services/api.ts             # typowany klient HTTP do BE
├── utils/
│   ├── formatters.ts            # formatowanie, uprawnienia i sortowanie
│   ├── errors.ts                 # wspólne mapowanie błędów API na komunikaty
│   └── pagination.ts            # czyste funkcje paginacji
├── types.ts                    # kontrakty domenowe FE
└── styles/
    └── global.css              # fonty, tokeny, reset i style bazowe
```

Każdy moduł trzyma swój arkusz obok komponentu, np. `features/fleet/VehiclesScreen.tsx` i `VehiclesScreen.css`. Style wydruku są wydzielone do `features/roadCards/PrintRoadCardScreen.css`, a style współdzielone pozostają w `components/ui.css`.

## Zasady

- `App.tsx` nie zawiera logiki formularzy ani CRUD — tylko składa aplikację z ekranów.
- Komunikacja z backendem odbywa się przez `services/api.ts`.
- Ekrany nie znają szczegółów sesji poza obiektem `User` przekazanym przez `App`.
- Wspólne elementy UI trafiają do `components/ui.tsx`.
- Powtarzalny stan interakcji trafia do `hooks/`, a komponenty ekranów pozostają odpowiedzialne za widok i operacje domenowe.
- Paginacja, sortowanie i formatowanie są czystymi funkcjami lub wyspecjalizowanymi hookami — nie są kopiowane między ekranami.
- Potwierdzenie usuwania jest wspólne, ale sama operacja usunięcia pozostaje w ekranie, który zna reguły domenowe.
- Formatowanie nazw, dat i uprawnień trafia do `utils/formatters.ts`.
- Nowy moduł powinien dostać własny katalog w `features/` zamiast rozbudowywać `App.tsx`.
- Motyw przełącza się z poziomu górnego paska; wybór jest zapisywany w `localStorage` pod kluczem `road-card-theme`.

## Uruchomienie

```bash
npm install
npm run dev
```

Adres API można zmienić przez `VITE_API_URL`. Domyślnie frontend korzysta z `http://localhost:8000`.
