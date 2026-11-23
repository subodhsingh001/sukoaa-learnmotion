Sukoaa LearnMotion - Curriculum Mapping Patch 8

1. Extract this ZIP into your project root C:\Users\HP\sukoaa-learnmotion
2. In PowerShell, from the project root run:
   .\backend\.venv\Scripts\python.exe .\install_patch_8.py
3. Restart FastAPI (backend) and Next.js (frontend).
4. Open http://localhost:3000/book-workspace/2 and click Map Curriculum.

Installer updates only the existing models.py, main.py, and book workspace page
using targeted insertions; makes .before_curriculum_patch_8 backups.
It adds one database table via existing Base.metadata.create_all on backend startup.
For production, replace create_all with a reviewed Alembic migration.

Existing chapter publishing, authentication, and chapter detection are untouched.
Catalog suggestions are unverified starter entries; manual editing and review supported.
If current files have different code structure, installer stops before writing.
