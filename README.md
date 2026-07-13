# KSeF Master

KSeF Master is a full-stack application for working with Poland's **Krajowy System e-Faktur (KSeF)** — the national e-invoicing platform that becomes mandatory for B2B transactions. It bundles a React/TypeScript SPA with an ASP.NET Core 8 backend that talks to the KSeF gateway, persists invoice metadata to Postgres, and generates compliant FA(3) documents with PDF visualisations and QR codes.

The repository is organised as a monorepo so that frontend and backend ship and evolve together.

---

## Tech stack

**Frontend (`ksef_master_frontend/`)**
- React 19 + TypeScript 5.9
- Vite 7 (SWC plugin)
- React Router 6, TanStack Query 5
- Axios for HTTP, ESLint 9 (typescript-eslint)

**Backend (`ksef_master_backend/`)**
- ASP.NET Core 8 (Web API)
- Entity Framework Core 8 + Npgsql (PostgreSQL / Neon)
- FluentValidation, JWT bearer auth, BCrypt
- QuestPDF for invoice visualisations, QRCoder for KSeF QR codes
- Swashbuckle (Swagger) for API documentation
- Dockerfile included for containerised deployment

**Tooling**
- GitHub Actions for CI (separate pipelines per app)
- npm for the frontend, `dotnet` CLI for the backend

---

## Repository layout

```
KSeF_Master/
├── ksef_master_backend/      # ASP.NET Core 8 Web API
├── ksef_master_frontend/     # Vite + React + TS SPA
├── .github/workflows/        # CI pipelines (frontend.yml, backend.yml)
├── .gitignore
├── README.md                 # English (this file)
└── README_PL.md              # Polish version
```

Each app keeps its own README and, in the case of the frontend, a `docs/` folder with deeper material on architecture, configuration and deployment.

---

## Getting started

### Prerequisites

| Tool | Version |
|------|---------|
| Node.js | 20.x (CI uses 20) |
| npm | 10.x |
| .NET SDK | 8.0.x |
| PostgreSQL | 14+ (Neon is supported out of the box) |

A running PostgreSQL instance is only required for the backend. The frontend can be run independently against a mocked or remote backend.

### Backend (`ksef_master_backend/`)

```bash
cd ksef_master_backend

# Restore + build
dotnet restore
dotnet build

# Local config — copy and edit
cp appsettings.json appsettings.Development.local.json

# Apply EF Core migrations
dotnet ef database update

# Run
dotnet run
```

The API listens on the URLs configured in `Properties/launchSettings.json`. Swagger UI is available at `/swagger` while running in the `Development` environment.

Sensitive values (JWT signing key, KSeF certificate paths, Postgres connection string) should go into **User Secrets** or `appsettings.Development.local.json` — never commit them. See the `Infrastructure/` folder for the DI wiring and the `Migrations/` folder for the database schema.

### Frontend (`ksef_master_frontend/`)

```bash
cd ksef_master_frontend

npm install
npm run dev
```

Then open `http://localhost:5173`. The dev server proxies `/health` and `/api` to the backend. Copy `.env.example` to `.env` only when you need to override the backend URL, for example to use a remote API.

Available scripts:

| Script | Purpose |
|--------|---------|
| `npm run dev` | Vite dev server with HMR |
| `npm run build` | Type-check (`tsc -b`) and production build |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | ESLint over the codebase |

---

## Running tests

The frontend uses Vitest. CI runs the test suite with coverage in addition to ESLint, TypeScript type-checking and the production build.

The backend uses `dotnet test`. Test projects should live next to their target as `*.Tests.csproj` and be added to a solution file; the CI workflow already runs `dotnet test` against the whole repo and will pick them up the moment they exist.

```bash
# Frontend
cd ksef_master_frontend
npm run lint
npm test
npm run build

# Backend
cd ksef_master_backend
dotnet test --no-build --verbosity normal
```

---

## CI/CD

GitHub Actions workflows live under `.github/workflows/`:

- **`frontend.yml`** — triggered by changes to `ksef_master_frontend/**`. Runs `npm ci`, `npm run lint`, `tsc --noEmit` and `npm run build` on Node 20. Uploads the `dist/` artifact for inspection.
- **`backend.yml`** — triggered by changes to `ksef_master_backend/**`. Runs `dotnet restore`, `dotnet build --no-restore -c Release` and `dotnet test --no-build -c Release` on the .NET 8 SDK. NuGet packages are cached between runs.

Both pipelines run on `push` and `pull_request` against `main`, with concurrency control so that an older run on the same branch is cancelled when a new push lands.

---

## Contributing

1. Branch off `main`. Use a descriptive prefix (`feat/`, `fix/`, `refactor/`, `chore/`, `docs/`).
2. Keep changes scoped — one PR per logical change. The frontend and backend can be modified in the same PR when the contract changes on both ends.
3. Commit messages follow a loose [Conventional Commits](https://www.conventionalcommits.org/) style (see the existing history for examples).
4. Run the relevant CI checks locally before pushing (`npm run lint && npm run build` / `dotnet build && dotnet test`).
5. Open a pull request against `main`. CI must be green before review.

Issues and discussion happen on GitHub. For security disclosures please contact the maintainers privately rather than opening a public issue.

---

## License

Internal project. See the repository owner for licensing terms.
