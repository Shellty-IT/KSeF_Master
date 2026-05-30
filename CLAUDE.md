# KSeF Master — CLAUDE.md

## What is KSeF Master

KSeF Master is a middleware system between Poland's national e-invoicing platform
(**Krajowy System e-Faktur**, Ministry of Finance API) and business operators.
It allows operators to authenticate with KSeF using a token or X.509 certificate,
manage issued/received invoices, and process invoice drafts submitted by the
external **SmartQuote** CRM.

## Repository & Hosting

- GitHub: https://github.com/Shellty-IT/KSeF_Master
- Local: `C:\Users\Tomek\Desktop\Projekty\KSeF-Master`
- Backend hosting: Render
- Frontend hosting: Netlify — https://ksef-master.netlify.app

## Stack

**Backend:** .NET 8 / C# / Entity Framework Core / PostgreSQL (Neon, production) /
SQLite (local dev)

**Frontend:** React + Vite / TypeScript / TanStack Query / Axios

**Auth:** JWT (operators) + `[ApiKeyAuth]` header filter (SmartQuote integration)

**CI:** GitHub Actions — tests on every push, CodeQL security analysis

**Tests backend:** xUnit — 59 validator tests

**Tests frontend:** Vitest — 45 helper tests

## Architecture

Monorepo: `ksef_master_backend/` (.NET) + `ksef_master_frontend/` (React)

```
ksef_master_backend/
  Controllers/                          # REST endpoints
  Services/
    Auth/                               # JWT, user auth, company profile
    External/                           # SmartQuote integration
      ExternalDraftService.cs
      ExternalDraftValidator.cs
    KSeF/                               # KSeF API: auth, invoices, session, cert, crypto
    Invoice/                            # XML generation
    Pdf/                                # PDF + QR code generation
  Models/
    Data/AppDbContext.cs                # EF Core config, indexes, jsonb converters
    ExternalDraft.cs                    # SmartQuote draft model
    Requests/                           # Request DTOs
  Infrastructure/Extensions/
    ServicesExtensions.cs               # DI registration
  Middleware/
    ApiKeyAuthAttribute.cs              # [ApiKeyAuth] filter
  Migrations/                           # EF Core migrations (never modify existing)
```

**DI scoping:**
- `IExternalDraftService` → `AddScoped`
- `KSeFSessionManager` → `AddSingleton`
- `ExternalDraftValidator` → `AddSingleton`
- Repositories → `AddScoped`

## Integration: SmartQuote

SmartQuote (`C:\Users\Tomek\Desktop\Projekty\SmartQuote`) submits accepted offers
as invoice drafts. The KSeF Master operator approves or rejects them. After a
decision, KSeF Master sends a signed webhook back to SmartQuote.

### Endpoints for SmartQuote — protected by `[ApiKeyAuth]` (`X-API-Key` header)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/import/companies/exists?nip=` | NIP preflight — check if company exists |
| POST | `/api/v1/import/smartquote` | Import invoice draft |
| GET | `/api/v1/import/drafts/by-smartquote/{id}` | Lookup draftId by smartQuoteId (idempotent retry) |

### Endpoints for operators — protected by `[Authorize]` (JWT)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/import/drafts` | List drafts (filter by status, multi-tenant by NIP) |
| GET | `/api/v1/import/drafts/{id}` | Draft details |
| POST | `/api/v1/import/drafts/{id}/approve` | Approve draft |
| POST | `/api/v1/import/drafts/{id}/reject` | Reject draft (requires `{ reason }`) |

**Status flow:** `PENDING` → `APPROVED` / `REJECTED`

## ExternalDraft Entity

```csharp
public class ExternalDraft {
    string Id;                 // Guid
    string SmartQuoteId;       // unique index
    string OfferNumber;
    ExternalDraftStatus Status; // PENDING / APPROVED / REJECTED — stored as string
    string IssueDate;          // YYYY-MM-DD
    string DueDate;            // YYYY-MM-DD
    string SellerNip;          // index (multi-tenant filter)
    string SellerName, SellerAddress, SellerCity, SellerPostalCode;
    string BuyerNip, BuyerName, BuyerAddress, BuyerCity, BuyerPostalCode;
    List<ExternalDraftItem> Items;  // jsonb column
    decimal TotalNet, TotalVat, TotalGross; // precision(18,2)
    string Currency;           // PLN / EUR / USD / GBP
    int PaymentDays;
    DateTime CreatedAt;
    DateTime? ProcessedAt;
    string? ProcessedBy;       // operator email
    string? RejectionReason;
}
```

## Key Technical Decisions

### 1. Race condition — duplicate import

No pre-check SELECT. PostgreSQL unique index on `SmartQuoteId`. `SaveChangesAsync`
throws `DbUpdateException` with `PostgresException.SqlState == "23505"` →
caught and re-thrown as `DuplicateSmartQuoteIdException(existingDraftId)` → HTTP
409 with the existing `draftId`. SmartQuote uses this id for idempotent retries.

### 2. Atomic approve / reject

`ExecuteSqlAsync` with `FormattableString` (auto-parameterised, no EF1002 warning):

```sql
UPDATE "ExternalDrafts" SET "Status"='APPROVED' WHERE "Id"={id} AND "Status"='PENDING'
```

If `affected == 0` → return `null` → `BadRequest`. No separate `SELECT` before
the update.

### 3. HMAC-SHA256 webhook signing

Outbound webhooks to SmartQuote are signed:
```
HMAC-SHA256(apiKey, "{timestamp}.{smartQuoteId}.{action}")
```
Headers sent: `X-Timestamp` (Unix seconds) + `X-Signature` (hex lowercase).
SmartQuote verifies the signature with a ±5-minute replay window.

### 4. Webhook retry

`SendWebhookWithRetryAsync`: 4 attempts, backoff 1s / 2s / 4s.
Fire-and-forget (`_ = SendWebhookWithRetryAsync(...)`). Final failed attempt
logs `LogError`.

### 5. Multi-tenancy

Every operator query is filtered by `SellerNip == CompanyProfile.Nip`.
`GetCurrentUserNipAsync()` extracts the NIP from the JWT claim, then hits the DB.
Applied in every query — no operator can see another operator's drafts.

### 6. Items as jsonb

`List<ExternalDraftItem>` stored as a `jsonb` column in PostgreSQL.
EF Core value conversion via `JsonSerializer` + `ValueComparer` for change
tracking. Avoids a separate line-items table for ephemeral import data.

### 7. Encryption at rest

`ITokenEncryptionService` (singleton) encrypts KSeF session tokens, X.509
certificates, private keys, and certificate passwords stored in `CompanyProfile`.
Algorithm: AES-256-CBC, random IV per operation, key from `Encryption:Key`.

### 8. Frontend unit price mapping fix

```ts
unitPriceNet: item.quantity > 0 ? item.totalNet / item.quantity : 0
```
`item.unitPrice` was wrong after discounts — replaced with the derived value.

## Import Request Validation (`ExternalDraftValidator`)

- `smartQuoteId`, `offerNumber` — required
- `issueDate`, `dueDate` — format `YYYY-MM-DD`, `dueDate >= issueDate`
- Seller & buyer: `name`, `address`, `city`, `postalCode` required; `nip` = exactly 10 digits
- `items`: min 1, max 500; each item: `name` required, `quantity > 0`,
  `unitPrice >= 0`, `totalGross >= 0`
- `totalGross > 0`
- `currency`: `PLN` / `EUR` / `USD` / `GBP`

## Configuration

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "..."
  },
  "Jwt": {
    "Key": "",              // min 32 chars, required
    "Issuer": "KSeFMaster",
    "Audience": "KSeFMasterApp",
    "ExpirationHours": 24
  },
  "Encryption": {
    "Key": ""               // AES key for KSeF tokens and certificates
  },
  "SmartQuote": {
    "ApiKey": "",           // shared secret (= KSEF_MASTER_API_KEY in SmartQuote .env)
    "WebhookUrl": ""        // SmartQuote backend URL, e.g. https://smartquote-backend.onrender.com
  },
  "KSeF": {
    "DefaultEnvironment": "Test",
    "TimeoutSeconds": 60,
    "Environments": {
      "Test":       { "ApiBaseUrl": "https://api-test.ksef.mf.gov.pl/v2/", ... },
      "Production": { "ApiBaseUrl": "https://api.ksef.mf.gov.pl/v2/",      ... }
    }
  },
  "App": {
    "Url": "https://ksef-master.netlify.app/"
  }
}
```

Local dev: copy `appsettings.json` → `appsettings.Development.local.json` (gitignored)
and fill in secrets. Alternatively: `dotnet user-secrets set "Jwt:Key" "..."`.

## Key Files

### Backend

| File | Role |
|------|------|
| `Services/External/ExternalDraftService.cs` | Import, approve, reject, HMAC-sign, webhook retry |
| `Services/External/ExternalDraftValidator.cs` | Validate SmartQuote import request |
| `Controllers/ImportController.cs` | All SmartQuote + operator draft endpoints |
| `Models/Data/AppDbContext.cs` | EF Core config, indexes, jsonb converter |
| `Models/ExternalDraft.cs` | ExternalDraft + ExternalDraftItem models |
| `Middleware/ApiKeyAuthAttribute.cs` | `[ApiKeyAuth]` filter |
| `Infrastructure/Extensions/ServicesExtensions.cs` | DI registration |
| `Migrations/20260528150310_AddExternalDrafts.cs` | ExternalDrafts table migration |

### Frontend

| File | Role |
|------|------|
| `src/services/externalDraftsApi.ts` | getDrafts, approveDraft, rejectDraft, mapDraftToInvoiceForm |
| `src/views/imported/ImportedDrafts.tsx` | Draft list view |
| `src/views/imported/DraftPreviewModal.tsx` | Draft preview |
| `src/views/imported/RejectDraftModal.tsx` | Reject modal |
| `src/views/imported/useDraftActions.ts` | Action logic |

## Project Status

**Done (in main):**
- ExternalDrafts: PostgreSQL table, EF Core migration, jsonb Items, indexes
- NIP preflight (`/companies/exists`)
- Draft import (`/smartquote`) with idempotency (unique index + 409)
- Multi-tenant filtering (all queries filtered by SellerNip)
- Atomic approve / reject (`UPDATE WHERE PENDING`, ExecuteSqlAsync + FormattableString)
- Webhook retry: 4 attempts, backoff 1s / 2s / 4s
- HMAC-SHA256 signing of outbound webhooks
- Idempotent retry endpoint (`by-smartquote/{id}`)
- Frontend: draft list, preview, approve, reject
- Unit price mapping fix in invoice form
- NuGet bumps: BCrypt 4.2.0, FluentValidation 11.3.1, Microsoft.* 8.0.27
- npm bumps: react-query 5.100.10, @types/node 25
- GitHub Actions: checkout v6, setup-dotnet v5, cache v5
- Dependabot disabled (`.github/dependabot.yml` removed)
- xUnit: 59 validator tests
- Vitest: 45 helper tests

## Pending

### Fixes / features to implement

- **Cold start mitigation** — backend on Render free tier has cold starts;
  implement a keep-alive solution (e.g. scheduled ping, upgrade to paid tier,
  or a frontend warmup hook similar to Postlio's `useWarmup`)

- **Suspicious invoice detection** — analyse collected invoice data to flag
  anomalies: unusual amounts, VAT rates deviating from norm, duplicate
  document numbers, sellers/buyers with no history, sudden spikes in value.
  Add a fraud indicator badge and dedicated view.

- **Invoice search & filter for fraud investigation** — allow operators to
  filter/search invoices by arbitrary parameters (amount range, date range,
  NIP, seller name, VAT rate, etc.) to support manual fraud investigation.

- **Windows offline / local install** — desktop installer for Windows with an
  embedded local database (SQLite or LocalDB); app must work without internet
  access and store invoices locally.

- **Deferred KSeF submission** — allow invoices to be saved locally and
  submitted to the KSeF gateway later (when connectivity is restored or
  operator decides to send).

**Considerations (not yet decided):**
- Verify EF Core migration `AddExternalDrafts` on Neon (production DB)
- End-to-end integration test on production (SmartQuote → KSeF Master → webhook)
- Monitoring failed webhooks — no persistence of failed attempts; consider outbox
  pattern or `WebhookAttempts` table
- SmartQuote-side draft status polling or SSE after submission

## Git & Commit Rules

- Agent does **not** commit, push, create PRs, or merge without an explicit instruction.
- After finishing work the agent always asks: "Commit and push?"
- Commit messages: short, plain English, describe what and why.
  Example: `add idempotency check for ExternalDraft submission`
- No `Co-Authored-By`, no AI mentions, no emoji in commits or branch names.
- Branch names: short, lowercase, English, hyphens.
  Example: `fix-cert-decrypt`, `add-draft-webhook-retry`

## Coding Rules

- No dead code, no redundant comments.
- All errors logged via `ILogger<T>`, never `Console.Write`.
- All SmartQuote endpoints protected by `[ApiKeyAuth]`.
- All operator endpoints protected by `[Authorize]`.
- New tables require a new EF Core migration. Never modify existing migrations.
