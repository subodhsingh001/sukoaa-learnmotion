# Milestone 14.8 + 15 (start) — what changed

## How to apply
1. Unzip over your project. **Keep your own `backend/.env`** (it is not in this zip). Add the optional lines from `backend/.env.example`.
2. Backend: `pip install -r requirements.txt` (adds `anthropic`), restart FastAPI. New tables (`asset_attempts`, `ai_usage`) are created automatically.
3. Frontend: `npm install && npm run dev`.
4. Optional, for real AI content: put `ANTHROPIC_API_KEY=...` in `backend/.env`. Without it an offline demo generator is used.

## Bugs fixed
- **Students could read quiz answers** (the chapter API returned `correct_option`). Answers are now removed for students and quizzes are graded on the server.
- Exercise marking guides were also visible to students — now hidden.
- **Last chapter could never be extracted** ("set an end page") — it now reads to the end of the PDF.
- Listing books loaded the full extracted text of every book (slow) — now deferred.
- OCR error handling could crash with a NameError when pytesseract was missing — now returns a clear message.
- Login had no brute-force protection — now 8 failed attempts / 5 min per email+IP → HTTP 429.
- Expired sessions now send you back to sign in with a clear message instead of a raw error.
- Role guard: `/textbooks`, `/book-workspace` were open to any visitor; `/my-learning` showed teacher data. Fixed.
- Sidebar had 10+ dead "Soon" links and several items pointing to the same page. Now only working pages are shown.
- `.env` with the real JWT secret and DB password was inside the ZIP. A `.gitignore` is added; **rotate `JWT_SECRET` and the Postgres password** if the zip was shared anywhere.

## New functions
- `POST /ai/chapters/{id}/generate` — notes / Q&A / quiz / exercises from extracted chapter text (always saved as DRAFT).
- Monthly AI limit per school (`AI_MONTHLY_LIMIT`), `GET /ai/usage`.
- Student reading area: `/study` (books → chapters → notes, quizzes, Q&A, exercises) with server-graded chapter quizzes.
- OCR readiness card on the upload page; bulk review/publish and manual chapter add on the book page.
- `/roadmap` page showing the real status of all 8 module groups (admin only).

## Design
New design system in `app/ui.css` + `components/ui/kit.tsx` (cards, tables, badges, tabs, switches, alerts, empty states). Every staff and student page was rebuilt on it; the old dashboard and 2D/3D lesson pages are untouched.

## Still to do (honest list)
- Pages were type-checked and the production build passes, but I could not open them in a browser here — please click through each role once.
- Tokens live in sessionStorage; move to httpOnly cookies before production.
- Use Alembic migrations before changing existing tables.
- Super Admin, billing, video, homework are not built yet (see /roadmap).

---
# Animated lessons (Milestone 19/20, first version)

Chapter text → **storyboard** (scenes + narration + template choice) → played in the browser with narration and captions.

- Backend: `POST /ai/chapters/{id}/storyboard` (scenes 4–10, language en/hi/bn), `GET /ai/templates`. Saved as a `video` asset in `storyboard_v1` format, always DRAFT. Anything malformed is stripped by `backend/app/storyboard.py`, so the AI can never inject code or unknown templates.
- Templates (the AI only picks one and fills its parameters): 2D — title card, bullets, number line, force diagram, orbit, cycle, formula. 3D — atom (reuses your `AtomicScene`) and solid shapes (reuses `GeometryScene`).
- Teacher: Book → Chapter → Learning material → Animated lessons: create, preview, edit narration and timing per scene, review, publish.
- Student: `/study/<book>/<chapter>` shows an **Animated lessons** tab first.
- Narration uses the browser's built-in voice (Web Speech API). Hindi/Bengali need a voice installed on the device; captions always show.
- Without `ANTHROPIC_API_KEY` an offline planner builds an English storyboard from key sentences (good for testing only).

Not done yet: MP4 export, studio-quality voice (cloud TTS), more templates (fractions, graphs, food chain art, human body), true/false and image scenes. Add templates in `backend/app/storyboard.py` (catalogue + params) and `components/video/scenes.tsx` (renderer).
