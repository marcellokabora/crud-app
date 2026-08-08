# Client Ledger

An administrator-only system for managing clients and their financial movements. The frontend is built with Next.js; a custom PHP MVC API owns authentication, business rules, and MySQL persistence.

## Current scope

Implemented:

- Administrator login, logout, session expiry, and login throttling
- Client search and creation from the browser UI
- Client earnings and expenses with all-time or date-range balance reports
- Client removal through deactivation
- Audited removal of earnings and expenses
- Transactional audit records for ledger changes
- PHP validation, CSRF protection, and prepared database queries
- Automated PHP tests for request parsing, guards, routing, and validation
- Initial schema for administrators, clients, ledger entries, login attempts, and audit logs

Clients are database records only. They do not receive credentials or application access.

## Architecture

```text
Browser -> Next.js frontend -> PHP JSON API -> MySQL
```

The repository keeps both runtimes separate:

```text
crud-app/
|-- frontend/   # Next.js pages, React components, and typed API client
|-- backend/    # Custom PHP routing, controllers, validation, and persistence
`-- README.md   # Project setup and technical reference
```

The integration boundary is `frontend/src/lib/api/client.ts`. Next.js has no Server Actions, API routes, direct database access, or authentication authority. PHP exclusively owns sessions, CSRF enforcement, validation, business rules, and MySQL access.

## Requirements

- Node.js 20+
- PHP 8.3+ with JSON, mbstring, PDO, and PDO MySQL extensions
- Composer 2
- MySQL 8+

## Backend setup

From the repository root:

```powershell
Set-Location backend
Copy-Item .env.example .env
composer install
```

Update the database values in `backend/.env`, create the database and least-privilege MySQL user, then run:

```powershell
php bin/migrate.php
```

### Create the first administrator

After the migration succeeds, create the first application administrator. The password must contain at least 12 characters.

```powershell
$env:ADMIN_PASSWORD = "a-long-unique-password"
php bin/create-admin.php "Administrator" admin@example.com
Remove-Item Env:ADMIN_PASSWORD
```

The command should print `Administrator created.` Use the email and password from this command to sign in to the application. This administrator is separate from any MySQL database user created during database setup.

Start the backend server:

```powershell
php -S localhost:8080 -t public
```

The API is available at `http://localhost:8080/api`. The administrator command reads the password from an environment variable to avoid storing it in shell history.

## Frontend setup

In another terminal, from the repository root:

```powershell
Set-Location frontend
Copy-Item .env.example .env.local
npm install
npm run dev
```

Open `http://localhost:3000`. The default frontend environment points to `http://localhost:8080/api`.

Ledger values display in USD by default. To use another portfolio currency, add its ISO 4217 code to `frontend/.env.local` and keep it consistent with `APP_CURRENCY` in `backend/.env`:

```dotenv
NEXT_PUBLIC_CURRENCY=USD
```

The application currently treats the ledger as a single-currency portfolio; currency conversion is outside the current scope.

## Application workflow

1. Sign in with an administrator account.
2. Open **Clients** to search for an existing client or create one.
3. Select a client name to open its ledger.
4. Record an earning or expense with an amount, occurrence date, and description.
5. Apply optional **From** and **To** dates to recalculate movements and totals for an inclusive period, or choose **All time** to clear the range.
6. Use the remove action on a client or movement when it should no longer be active.

The summary shows earnings, expenses, and the resulting balance. Removing a client deactivates and hides it while preserving its ledger. Removing a movement voids it, excludes it from reports, and retains it for audit history. New movements can only be recorded for active clients.

## API contract

| Method | Endpoint                           | Authentication  | Purpose                      |
| ------ | ---------------------------------- | --------------- | ---------------------------- |
| GET    | `/api/health`                      | Public          | API health check             |
| GET    | `/api/auth/csrf`                   | Public session  | Obtain a session-bound token |
| POST   | `/api/auth/login`                  | CSRF            | Administrator login          |
| GET    | `/api/auth/me`                     | Required        | Current administrator        |
| POST   | `/api/auth/logout`                 | Required + CSRF | End the current session      |
| GET    | `/api/clients?query=`              | Required        | Search clients               |
| POST   | `/api/clients`                     | Required + CSRF | Create a client              |
| POST   | `/api/clients/remove`              | Required + CSRF | Deactivate a client          |
| GET    | `/api/ledger?client_id=&from=&to=` | Required        | Client movements and totals  |
| POST   | `/api/ledger`                      | Required + CSRF | Record an earning or expense |
| POST   | `/api/ledger/remove`               | Required + CSRF | Void a ledger movement       |

Successful responses use `{ "data": ... }`. Errors use:

```json
{
  "error": {
    "code": "validation_failed",
    "message": "The submitted data is invalid.",
    "fields": {
      "name": ["Name is required."]
    }
  }
}
```

### Record a movement

`POST /api/ledger` accepts a decimal amount as a string so the server can convert it exactly to integer minor units without floating-point arithmetic:

```json
{
  "client_id": 42,
  "type": "earning",
  "amount": "1250.50",
  "occurred_on": "2026-08-08",
  "description": "August service payment"
}
```

A successful request returns `201 Created` with the new entry identifier:

```json
{
  "data": {
    "id": 108
  }
}
```

`type` must be `earning` or `expense`. Amounts must be positive with at most two decimal places, dates must use `YYYY-MM-DD`, and descriptions are required with a maximum length of 500 characters.

### Read a client report

`GET /api/ledger?client_id=42&from=2026-08-01&to=2026-08-31` returns the client, totals, and movements for the inclusive date range. Both date parameters are optional.

```json
{
  "data": {
    "client": {
      "id": 42,
      "name": "Acme Company"
    },
    "summary": {
      "earnings_minor": 125050,
      "expenses_minor": 25000,
      "balance_minor": 100050
    },
    "entries": [
      {
        "id": 108,
        "type": "earning",
        "amount_minor": 125050,
        "occurred_on": "2026-08-08",
        "description": "August service payment"
      }
    ]
  }
}
```

The balance is calculated as earnings minus expenses. Voided entries are excluded, and movements are ordered by occurrence date and identifier, newest first.

## Authentication flow

1. The browser requests `/api/auth/csrf`, creating a PHP session when needed.
2. Login sends credentials as JSON and the token in `X-CSRF-Token`.
3. PHP verifies the administrator and regenerates the session identifier.
4. Later requests include the `HttpOnly` session cookie with `credentials: "include"`.
5. Every state-changing request requires the current session-bound CSRF token.

Development permits only the origin configured by `APP_ORIGIN`. Production should expose the frontend and `/api/*` from one HTTPS origin.

## Data model

- `administrators`: login identity, password hash, and active status
- `clients`: contact data, external reference, status, and creator
- `ledger_entries`: immutable earning or expense amounts stored in integer minor units, plus void and replacement metadata
- `login_attempts`: email/IP login history used for throttling
- `audit_logs`: actor, action, entity, metadata, IP address, and timestamp

PDO uses native prepared statements, exception mode, and UTF-8. Foreign keys preserve ownership and financial history.

## Security controls

- Password hashing through `password_hash` and verification through `password_verify`
- `HttpOnly`, `SameSite=Lax` session cookies, with `Secure` enabled in production
- Session identifier regeneration after login
- 30-minute idle and 12-hour absolute session expiry
- Login throttling by normalized email or IP address
- Session-bound CSRF tokens on mutations
- Server-side input normalization and validation
- Exact decimal-to-minor-unit conversion for monetary input
- Transactional client, ledger, and audit-log writes
- Soft removal that preserves client and financial history
- Native PDO prepared statements for all database values
- Stable production errors without stack traces or credentials
- `Cache-Control: no-store` and `X-Content-Type-Options: nosniff` on API responses
- Backend-only database credentials and environment configuration

## Validation

Frontend:

```powershell
Set-Location frontend
npm install
npm run lint
npm run build
npm audit --audit-level=high
```

Backend:

```powershell
Set-Location backend
composer install
composer validate
Get-ChildItem -Recurse -Filter *.php | ForEach-Object { php -l $_.FullName }
composer test
```

Backend validation requires the PHP, Composer, and MySQL runtimes described above.
