# SUKOAA Module 1 - Authentication update

## Scope delivered
- Super Admin account type and a protected `/super-admin` account directory.
- Account activation/deactivation and administrator-assisted password reset API.
- Password change and server-side logout revoke existing access tokens using `token_version`.
- Login rejects disabled accounts; `/me` and authenticated endpoints reject revoked tokens.
- School Admin may manage only teacher/student accounts in their own school through `/auth/accounts/{id}`. Super Admin may manage accounts across schools, except other Super Admin accounts.

## Important limitations
- This is NOT a complete production security certification. Cross-school authorization for every legacy textbook/assessment endpoint has NOT been exhaustively verified.
- Email-based self-service password recovery, rotating refresh tokens, MFA, comprehensive audit logging, and complete Super Admin school onboarding are NOT implemented.
- Backend Python syntax compilation passed. Full PostgreSQL integration tests and Next.js production build have NOT been confirmed in this environment.

## Installation (Windows PowerShell)
1. Back up PostgreSQL before any schema change.
2. Extract this ZIP over a copy of your project; keep your existing `.env` and database.
3. `cd C:\Users\HP\sukoaa-learnmotion\backend`
4. `.\.venv\Scripts\python.exe -m pip install -r requirements.txt`
5. `.\.venv\Scripts\python.exe upgrade_auth.py`
6. `.\.venv\Scripts\python.exe create_super_admin.py` (interactive; only for first Super Admin)
7. `.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000`
8. In another PowerShell: `cd C:\Users\HP\sukoaa-learnmotion`; `npm ci`; `npm run build`; `npm run dev`.
9. Sign in as Super Admin; open `/super-admin`. Check `/me` and `/auth/accounts`.

## API examples
- `POST /auth/change-password` JSON `{ "current_password":"...", "new_password":"..." }` (minimum 12 chars)
- `POST /auth/logout` (revoke all existing tokens for this account)
- `GET /auth/accounts` (admin or super_admin)
- `PATCH /auth/accounts/{id}/active` JSON `{ "active": false }`
- `POST /auth/accounts/{id}/reset-password` JSON `{ "new_password":"..." }`

## Compatibility note
Previously issued JWTs will be rejected because they do not contain `ver`. All users must sign in again. Existing user records remain in place.

## Security note
`create_super_admin.py` must only be run by an authorized operator on a trusted server. Never commit `.env`, tokens, database dumps, or user passwords to source control.
