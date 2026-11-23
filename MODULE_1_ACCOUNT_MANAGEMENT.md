# SUKOAA Module 1: School-wise Super Admin account management

## Features
- School-grouped accounts table with filters by school, role and name/email
- Edit name, email, school and role; pause/reactivate; delete with confirmation modal
- Server-side Super Admin authorization for edit/delete, and existing role-based activation
- Protect Super Admin accounts and own account from modifications
- Session invalidation on edits/activation; reject deletion if referenced records exist
- Interactive Lessons navigation and lesson pages retained unchanged
- `export const instant = false` on `/super-admin` server route to skip unsupported instant-navigation validation

## Install on Windows
1. Back up the PostgreSQL database and project source.
2. Extract into `C:\Users\HP\sukoaa-learnmotion`, preserving folder paths.
3. Backend: `cd backend` then `.\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8002`
4. Frontend `.env.local` should use `NEXT_PUBLIC_SUKOAA_API_URL=http://127.0.0.1:8002` (NOT `NEXT_PUBLIC_API_BASE_URL`).
5. Frontend: `npm ci`, `npm run build`, `npm run dev`.
6. Log in as Super Admin and open `/super-admin`.

No database migration is needed for this update. Existing school names are loaded from `schools`.

## Important limitations
- Hard delete is intentionally rejected by PostgreSQL when related school or learning records exist; pause instead.
- Moving an account to another school does not move its learning records, enrollments or assignments. Treat this as a privileged operation; consider disabling school reassignment after enrollment in production.
- `InstantServer` warning is suppressed only for this route; other routes may need separate treatment.
- Interactive Lessons are preserved, not declared fully complete.
