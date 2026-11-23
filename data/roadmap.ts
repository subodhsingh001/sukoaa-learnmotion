export type Status = "done" | "partial" | "fix" | "todo";
export type RoadmapGroup = { name: string; modules: { name: string; status: Status; note?: string }[] };

/** Honest module status. Update this file as milestones land; the /roadmap page renders it. */
export const ROADMAP: RoadmapGroup[] = [
  { name: "Super Admin & SaaS", modules: [
    { name: "Super Admin Dashboard", status: "todo" }, { name: "School Registration & Onboarding", status: "todo" },
    { name: "School Directory & Management", status: "todo" }, { name: "Subscription Plans & Billing", status: "todo" },
    { name: "Payment Gateway & Invoices", status: "todo" }, { name: "Roles & Permissions", status: "partial", note: "Teacher permissions done" },
    { name: "School Usage & AI Credit Limits", status: "partial", note: "Monthly AI limit per school enforced" } ] },
  { name: "School Management", modules: [
    { name: "School Dashboard", status: "partial" }, { name: "Class & Section Management", status: "partial" }, { name: "Subject Management", status: "todo" },
    { name: "Teacher Management", status: "partial" }, { name: "Teacher Class & Subject Assignment", status: "partial" },
    { name: "Student Management & Enrollment", status: "partial" }, { name: "Academic Year Management", status: "todo" }, { name: "Academic Calendar & Timetable", status: "todo" } ] },
  { name: "Textbook & Curriculum", modules: [
    { name: "Class & Subject Book Library", status: "done" }, { name: "PDF Upload & Book Management", status: "done" },
    { name: "OCR for Scanned Textbooks", status: "done" }, { name: "Automatic Chapter Detection", status: "done" },
    { name: "Automatic Page Range & PDF Offset", status: "done" }, { name: "Chapter Information & Editing", status: "done" },
    { name: "Extract Chapter Text & Preview", status: "done" },
    { name: "Curriculum Mapping (CBSE/ICSE)", status: "partial", note: "Mapping UI installed; verify saving and reloading before marking working" },
    { name: "Book & Chapter Approval", status: "done" } ] },
  { name: "AI Content Studio", modules: [
    { name: "AI Notes Generator", status: "partial", note: "Claude with API key, offline fallback otherwise" }, { name: "AI Question & Answer Generator", status: "partial" },
    { name: "AI Quiz Generator", status: "partial" }, { name: "AI Exercise Generator", status: "partial" },
    { name: "Multiple Question Sets per Chapter", status: "done" }, { name: "MCQ, Fill-in-Blanks & True/False", status: "partial", note: "MCQ and fill-in-blank; True/False pending" },
    { name: "AI Answer Verification", status: "todo" }, { name: "Content Review & Publishing", status: "done" }, { name: "Content Version History", status: "todo" } ] },
  { name: "Animation & Video", modules: [
    { name: "Existing 2D/3D Interactive Lessons", status: "partial" }, { name: "AI Chapter-to-Storyboard Generator", status: "partial", note: "Claude or offline planner; teacher edits scenes" },
    { name: "Reusable 2D Animation Templates", status: "partial", note: "7 templates: title, bullets, number line, force, orbit, cycle, formula" }, { name: "Reusable 3D Animation Templates", status: "partial", note: "Atom and solid shapes" },
    { name: "Automatic Narrated Video Generation", status: "todo" }, { name: "Voiceover & Subtitles", status: "partial", note: "Browser voice + captions; no studio-quality audio yet" },
    { name: "Video Library & Player", status: "partial", note: "In-browser player; no MP4 export yet" }, { name: "Video Review & Publishing", status: "done" } ] },
  { name: "Student Learning", modules: [
    { name: "Student Dashboard", status: "done" }, { name: "My Books & Chapters", status: "done" }, { name: "Chapter Learning Experience", status: "partial" },
    { name: "Notes & Video Learning", status: "partial", note: "Notes and in-browser animated lessons done" }, { name: "Quiz & Assessment", status: "done", note: "Server-graded, answers never sent to the browser" },
    { name: "Exercise Submission", status: "todo" }, { name: "Homework & Assignments", status: "todo" }, { name: "Progress Tracking", status: "partial" },
    { name: "Revision & Recommendations", status: "todo" }, { name: "Learning Certificates", status: "todo" } ] },
  { name: "Teacher Workspace", modules: [
    { name: "Teacher Dashboard", status: "done" }, { name: "Assigned Classes & Subjects", status: "partial" }, { name: "Create Questions & Exercises", status: "done" },
    { name: "Assign Homework", status: "todo" }, { name: "Evaluate Student Submissions", status: "todo" },
    { name: "Student Performance Monitoring", status: "partial" }, { name: "Teacher Content Permissions", status: "done" } ] },
  { name: "Reporting & Operations", modules: [
    { name: "School Reports", status: "partial" }, { name: "Student Performance Reports", status: "partial" }, { name: "Teacher Reports", status: "partial" },
    { name: "Platform Analytics", status: "todo" }, { name: "Notifications & Announcements", status: "todo" }, { name: "Audit Logs", status: "todo" },
    { name: "Backups & Disaster Recovery", status: "todo" }, { name: "Security & School Data Isolation", status: "partial", note: "Isolation enforced per school; hardening continues" },
    { name: "Production Deployment & Monitoring", status: "todo" } ] },
];
