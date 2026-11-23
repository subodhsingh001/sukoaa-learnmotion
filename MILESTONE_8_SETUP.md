# Milestone 8 — Physics Lab and Commercial Architecture Planning

## New interactive lesson
Open `/learn/force-and-motion` (also linked from Explore). Adjust mass, applied force and opposing force, make a prediction, run/pause/reset a 5-second idealized one-dimensional experiment, and complete the quiz.

The experiment uses Newton's second law `a = (F_applied - F_opposing)/mass`, `v = at`, `s = 0.5at²`. The track is illustrative and intentionally not drawn to physical scale. The opposing force is a constant input, not a sophisticated kinetic/static friction simulation. This is a teaching prototype, not a certified lab.

## Storage audit (as of Milestone 8)
- Curriculum/topic definitions and quizzes are source-controlled TypeScript modules in `data/` and `components/`.
- 3D simulations are React components.
- Quiz completion is saved only in browser `localStorage`, keyed by lesson. It is not synchronized across devices, backed up, tied to a verified student, or visible to a teacher.
- No backend, database, school tenant management or authentication exists yet.

## Proposed production platform (not yet implemented)
- Next.js student/teacher/admin portals; Python FastAPI service; PostgreSQL; managed file/object storage for media and lesson assets.
- Multi-tenant model: `organizations`, `campuses`, `users`, `memberships`, `classes`, `enrollments`, `curricula`, `subjects`, `topics`, `lessons`, `lesson_versions`, `activities`, `attempts`, `responses`, `progress_events`, `assignments`, `audit_logs`.
- Every school-owned record must be authorized and scoped by organization. Implement RBAC, consent/age-appropriate policies, encryption, backups, observability, accessibility, curriculum review and audit trails before selling to schools.
- Persist quiz attempts server-side with a lesson-version ID, timestamps and scoring details. Do not trust browser-reported scores; grade server-side.
- Plan migrations, seed content, integration tests, security tests, and data retention/deletion before live student deployment.

## Roadmap recommendation
1. Next milestone: database-backed auth, school/class/student entities and progress API; migrate local completion to authenticated progress when possible.
2. Authoring and versioning for curriculum-aligned lessons; assessment rubric and analytics.
3. Real scientific interaction for biology/chemistry, teacher controls, accessibility, multilingual support and AI tutor with guardrails.
4. Pilot with teachers, measure outcomes, establish support and SLAs before commercial rollout.

## Local run
`npm install`, `npm run dev`, open `http://localhost:3000/learn/force-and-motion`.
