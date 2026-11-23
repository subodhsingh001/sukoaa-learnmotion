# Role-based navigation and route access

- Student: Dashboard, Explore, My Learning.
- Teacher: Dashboard, Explore, My Learning, Teacher.
- Admin: all available menus including School Admin and Teacher.
- The top-right profile uses the authenticated `/me` response instead of static demo data.
- The shared client-side route guard denies unauthorized access to `/teacher` and `/school-admin`; FastAPI authorization remains the security boundary.
- Log out and back in after installing to refresh the current account.

Run `npm install` and `npm run dev` in the project root. Keep FastAPI on port 8000 and PostgreSQL on host port 15432.

## Verification
1. Student: no Teacher or School Admin links; direct `/teacher` and `/school-admin` show Access denied.
2. Teacher: Teacher link visible, School Admin hidden and direct `/school-admin` denied.
3. Admin: both Teacher and School Admin visible.
4. Profile name and role update when switching accounts.

Client navigation is not security by itself: server endpoints must continue to enforce roles and school scope.
