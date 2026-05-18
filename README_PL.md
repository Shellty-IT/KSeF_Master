# KSeF Master

KSeF Master to aplikacja full-stack do pracy z **Krajowym Systemem e-Faktur (KSeF)** — krajową platformą e-fakturowania, która staje się obowiązkowa dla obrotu B2B. Repozytorium łączy frontend SPA (React/TypeScript) z backendem ASP.NET Core 8, który komunikuje się z bramką KSeF, przechowuje metadane faktur w PostgreSQL i generuje zgodne dokumenty FA(2) wraz z wizualizacjami PDF i kodami QR.

Projekt zorganizowany jest jako monorepo, dzięki czemu frontend i backend są rozwijane i wydawane wspólnie.

---

## Stack technologiczny

**Frontend (`ksef_master_frontend/`)**
- React 19 + TypeScript 5.9
- Vite 7 (plugin SWC)
- React Router 6, TanStack Query 5
- Axios do żądań HTTP, ESLint 9 (typescript-eslint)

**Backend (`ksef_master_backend/`)**
- ASP.NET Core 8 (Web API)
- Entity Framework Core 8 + Npgsql (PostgreSQL / Neon)
- FluentValidation, JWT bearer auth, BCrypt
- QuestPDF do wizualizacji faktur, QRCoder do generowania kodów QR KSeF
- Swashbuckle (Swagger) do dokumentacji API
- Dockerfile do wdrożenia konteneryzowanego

**Narzędzia**
- GitHub Actions do CI (osobne pipeliny dla obu aplikacji)
- npm dla frontendu, CLI `dotnet` dla backendu

---

## Struktura repozytorium

```
KSeF_Master/
├── ksef_master_backend/      # ASP.NET Core 8 Web API
├── ksef_master_frontend/     # SPA Vite + React + TS
├── .github/workflows/        # Pipeliny CI (frontend.yml, backend.yml)
├── .gitignore
├── README.md                 # Wersja angielska
└── README_PL.md              # Wersja polska (ten plik)
```

Każda aplikacja ma własny README, a frontend dodatkowo katalog `docs/` ze szczegółową dokumentacją architektury, konfiguracji i wdrożenia.

---

## Pierwsze kroki

### Wymagania

| Narzędzie | Wersja |
|-----------|--------|
| Node.js | 20.x (CI używa 20) |
| npm | 10.x |
| .NET SDK | 8.0.x |
| PostgreSQL | 14+ (Neon działa od ręki) |

Działający PostgreSQL jest potrzebny tylko backendowi. Frontend można uruchomić osobno przeciwko zdalnemu lub zamockowanemu backendowi.

### Backend (`ksef_master_backend/`)

```bash
cd ksef_master_backend

# Restore + build
dotnet restore
dotnet build

# Lokalna konfiguracja — skopiuj i uzupełnij
cp appsettings.json appsettings.Development.local.json

# Zastosuj migracje EF Core
dotnet ef database update

# Uruchom
dotnet run
```

API nasłuchuje pod adresami skonfigurowanymi w `Properties/launchSettings.json`. Swagger UI dostępny jest pod `/swagger` w środowisku `Development`.

Wartości wrażliwe (klucz JWT, ścieżki do certyfikatu KSeF, connection string do Postgresa) trzymaj w **User Secrets** lub w pliku `appsettings.Development.local.json` — nigdy nie commituj ich do repozytorium. Konfiguracja DI znajduje się w folderze `Infrastructure/`, a schemat bazy w `Migrations/`.

### Frontend (`ksef_master_frontend/`)

```bash
cd ksef_master_frontend

npm install
npm run dev
```

Następnie otwórz `http://localhost:5173`. Serwer deweloperski proxy'uje `/health` oraz bazowy URL API do backendu — konfiguracja w `vite.config.ts`. Zmienne środowiskowe są wczytywane z plików `.env` (przed publikacją projektu publicznie warto dodać szablon `.env.example`).

Dostępne skrypty:

| Skrypt | Opis |
|--------|------|
| `npm run dev` | Serwer deweloperski Vite z HMR |
| `npm run build` | Type-check (`tsc -b`) i build produkcyjny |
| `npm run preview` | Lokalny podgląd buildu produkcyjnego |
| `npm run lint` | ESLint na całym kodzie |

---

## Uruchamianie testów

Frontend nie posiada jeszcze runnera testów — w roli bramki weryfikacyjnej działają `npm run lint` oraz `npm run build` (z `tsc`). Gdy testy jednostkowe/integracyjne zostaną dodane (planowany runner to Vitest), CI podchwyci je automatycznie przez `npm test`.

Backend korzysta z `dotnet test`. Projekty testowe powinny być umieszczane obok testowanego kodu jako `*.Tests.csproj` i podpinane do pliku solution; workflow CI już teraz uruchamia `dotnet test` na całym repozytorium i znajdzie je w momencie ich dodania.

```bash
# Frontend
cd ksef_master_frontend
npm run lint
npm run build

# Backend
cd ksef_master_backend
dotnet test --no-build --verbosity normal
```

---

## CI/CD

Workflow GitHub Actions znajdują się w katalogu `.github/workflows/`:

- **`frontend.yml`** — odpalany przy zmianach w `ksef_master_frontend/**`. Wykonuje `npm ci`, `npm run lint`, `tsc --noEmit` i `npm run build` na Node 20. Wgrywa artefakt `dist/` do podglądu.
- **`backend.yml`** — odpalany przy zmianach w `ksef_master_backend/**`. Wykonuje `dotnet restore`, `dotnet build --no-restore -c Release` oraz `dotnet test --no-build -c Release` na SDK .NET 8. Pakiety NuGet są cache'owane między runami.

Oba pipeliny uruchamiają się przy `push` i `pull_request` na `main`, z włączoną kontrolą `concurrency` — starszy run na tej samej gałęzi zostaje anulowany, gdy pojawi się nowszy.

---

## Współpraca przy projekcie

1. Twórz gałęzie z `main`. Stosuj opisowe prefiksy (`feat/`, `fix/`, `refactor/`, `chore/`, `docs/`).
2. Trzymaj zmiany w wąskim zakresie — jeden PR na jedną logiczną zmianę. Frontend i backend można modyfikować w tym samym PR-ze, kiedy kontrakt zmienia się po obu stronach.
3. Wiadomości commitów luźno trzymają się stylu [Conventional Commits](https://www.conventionalcommits.org/) — patrz istniejąca historia.
4. Przed pushem uruchom lokalnie odpowiednie checki (`npm run lint && npm run build` / `dotnet build && dotnet test`).
5. Otwórz pull request do `main`. CI musi być zielone przed review.

Issues i dyskusje toczą się na GitHubie. Zgłoszenia bezpieczeństwa kieruj prywatnie do maintainerów, a nie przez publiczne issue.

---

## Licencja

Projekt wewnętrzny. W sprawie warunków licencjonowania kontaktuj się z właścicielem repozytorium.
