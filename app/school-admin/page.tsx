"use client";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { GraduationCap, School, UserCog, Users } from "lucide-react";
import { api } from "@/lib/learning-api";
import { Badge, Button, Card, Empty, Field, Loading, LinkButton, Page, PageHeader, Pager, Stat, Tabs, useFlash } from "@/components/ui/kit";
import { statusTone } from "@/lib/format";

type Person = { id: number; full_name: string; email: string; role: string };
type Room = { id: number; name: string; teacher_id: number; teacher_name: string; student_count: number };
type Overview = { school: { name: string } | null; classrooms: number; enrolled_students: number; teachers: number | null };
type Tab = "classes" | "people" | "create";

export default function SchoolAdminPage() {
  const { error, busy, run, flash, setError } = useFlash();
  const [tab, setTab] = useState<Tab>("classes");
  const [ready, setReady] = useState(false);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [people, setPeople] = useState<Person[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [enrolled, setEnrolled] = useState<Person[]>([]);
  const [studentToAdd, setStudentToAdd] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [page, setPage] = useState(1);
  const [acct, setAcct] = useState({ full_name: "", email: "", password: "", role: "student" });
  const [room, setRoom] = useState({ name: "", teacher_id: "" });

  const refresh = useCallback(async () => {
    const [o, u, r] = await Promise.all([api<Overview>("/school/overview"), api<Person[]>("/school/users"), api<Room[]>("/school/classrooms")]);
    setOverview(o); setPeople(u); setRooms(r);
  }, []);
  const loadEnrolled = useCallback(async (id: number) => setEnrolled(await api<Person[]>(`/school/classrooms/${id}/students`)), []);

  useEffect(() => { refresh().catch((e) => setError(e.message)).finally(() => setReady(true)); }, [refresh, setError]);
  useEffect(() => { if (selected !== null) loadEnrolled(selected).catch((e) => setError(e.message)); }, [selected, loadEnrolled, setError]);

  const teachers = people.filter((p) => p.role === "teacher");
  const filtered = useMemo(() => people.filter((p) => (!roleFilter || p.role === roleFilter) &&
    `${p.full_name} ${p.email}`.toLowerCase().includes(search.toLowerCase())), [people, roleFilter, search]);
  const pages = Math.max(1, Math.ceil(filtered.length / 10));
  const visible = filtered.slice((Math.min(page, pages) - 1) * 10, Math.min(page, pages) * 10);
  const selectedRoom = rooms.find((r) => r.id === selected);

  async function addAccount(e: FormEvent) {
    e.preventDefault();
    if (await run(async () => { await api("/school/users", { method: "POST", body: JSON.stringify(acct) }); await refresh(); }, `${acct.role === "teacher" ? "Teacher" : "Student"} account created.`))
      setAcct({ ...acct, full_name: "", email: "", password: "" });
  }
  async function addRoom(e: FormEvent) {
    e.preventDefault();
    if (await run(async () => { await api("/school/classrooms", { method: "POST", body: JSON.stringify({ name: room.name, teacher_id: Number(room.teacher_id) }) }); await refresh(); }, "Classroom created."))
      setRoom({ name: "", teacher_id: "" });
  }
  const enroll = (e: FormEvent) => { e.preventDefault(); if (selected === null) return;
    void run(async () => { await api(`/school/classrooms/${selected}/enrollments`, { method: "POST", body: JSON.stringify({ student_id: Number(studentToAdd) }) }); setStudentToAdd(""); await Promise.all([loadEnrolled(selected), refresh()]); }, "Student enrolled."); };
  const unenroll = (id: number) => { if (selected === null) return;
    void run(async () => { await api(`/school/classrooms/${selected}/enrollments/${id}`, { method: "DELETE" }); await Promise.all([loadEnrolled(selected), refresh()]); }, "Student removed from class."); };

  if (!ready) return <Loading />;
  return (
    <Page>
      <PageHeader title="School administration" subtitle={overview?.school?.name ? `${overview.school.name} — manage people, classrooms and enrolment.` : "Manage people, classrooms and enrolment."}
        actions={<><LinkButton href="/school-admin/structure">Academic structure</LinkButton><LinkButton href="/school-admin/teachers">Teachers &amp; permissions</LinkButton></>} />
      {flash}
      <div className="sk-grid cols-4">
        <Stat label="Classrooms" value={overview?.classrooms} icon={<School size={20} />} />
        <Stat label="Enrolled students" value={overview?.enrolled_students} icon={<GraduationCap size={20} />} />
        <Stat label="Teachers" value={overview?.teachers} icon={<UserCog size={20} />} />
        <Stat label="Total accounts" value={people.length} icon={<Users size={20} />} />
      </div>
      <Tabs<Tab> value={tab} onChange={setTab} tabs={[{ id: "classes", label: "Classrooms" }, { id: "people", label: "People" }, { id: "create", label: "Add new" }]} />

      {tab === "classes" && (
        <div className="sk-split">
          <Card title="Classrooms" flush>
            {rooms.length === 0 ? <Empty title="No classrooms yet" text="Create your first classroom from the “Add new” tab." action={<Button variant="primary" onClick={() => setTab("create")}>Add classroom</Button>} /> :
              <div className="sk-table-wrap"><table className="sk-table"><thead><tr><th>Class</th><th>Teacher</th><th>Students</th></tr></thead><tbody>
                {rooms.map((r) => <tr key={r.id} className={r.id === selected ? "selected" : ""} onClick={() => setSelected(r.id)} style={{ cursor: "pointer" }}>
                  <td><b>{r.name}</b></td><td>{r.teacher_name}</td><td>{r.student_count}</td></tr>)}
              </tbody></table></div>}
          </Card>
          <Card title={selectedRoom ? `${selectedRoom.name} — students` : "Enrolment"} subtitle={selectedRoom ? undefined : "Select a classroom to manage its students."} flush={!selectedRoom}>
            {selectedRoom && <>
              <form onSubmit={enroll} style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                <select className="sk-select" aria-label="Student to enrol" required value={studentToAdd} onChange={(e) => setStudentToAdd(e.target.value)}>
                  <option value="">Choose a student…</option>
                  {people.filter((p) => p.role === "student" && !enrolled.some((s) => s.id === p.id)).map((p) => <option key={p.id} value={p.id}>{p.full_name}</option>)}
                </select><Button variant="primary" disabled={busy}>Enrol</Button>
              </form>
              {enrolled.length === 0 ? <p style={{ color: "var(--sk-muted)", fontSize: 14 }}>No students enrolled yet.</p> :
                enrolled.map((s) => <div className="sk-list-item" key={s.id} style={{ padding: "10px 0" }}>
                  <div style={{ flex: 1 }}><b style={{ fontSize: 14 }}>{s.full_name}</b><span className="sk-sub">{s.email}</span></div>
                  <Button size="sm" variant="danger" disabled={busy} onClick={() => unenroll(s.id)}>Remove</Button></div>)}
            </>}
          </Card>
        </div>
      )}

      {tab === "people" && (
        <Card flush>
          <div className="sk-card-head"><div className="sk-toolbar" style={{ width: "100%" }}>
            <input className="sk-input" placeholder="Search by name or email" aria-label="Search people" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
            <select className="sk-select" aria-label="Filter by role" value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}>
              <option value="">All roles</option><option value="admin">Admins</option><option value="teacher">Teachers</option><option value="student">Students</option></select>
          </div></div>
          <div className="sk-table-wrap"><table className="sk-table"><thead><tr><th>Name</th><th>Email</th><th>Role</th></tr></thead><tbody>
            {visible.map((p) => <tr key={p.id}><td><b>{p.full_name}</b></td><td>{p.email}</td><td><Badge tone={statusTone(p.role)}>{p.role}</Badge></td></tr>)}
          </tbody></table></div>
          {filtered.length === 0 && <Empty title="No matching people" />}
          <Pager page={Math.min(page, pages)} pages={pages} onPage={setPage} />
        </Card>
      )}

      {tab === "create" && (
        <div className="sk-grid cols-2">
          <Card title="Create a teacher or student account" subtitle="Share the temporary password securely; ask them to change it after first sign-in.">
            <form className="sk-form" onSubmit={addAccount}>
              <Field label="Full name"><input className="sk-input" required minLength={2} value={acct.full_name} onChange={(e) => setAcct({ ...acct, full_name: e.target.value })} /></Field>
              <Field label="Email"><input className="sk-input" type="email" required value={acct.email} onChange={(e) => setAcct({ ...acct, email: e.target.value })} /></Field>
              <Field label="Temporary password" hint="At least 10 characters."><input className="sk-input" type="password" required minLength={10} autoComplete="new-password" value={acct.password} onChange={(e) => setAcct({ ...acct, password: e.target.value })} /></Field>
              <Field label="Account type"><select className="sk-select" value={acct.role} onChange={(e) => setAcct({ ...acct, role: e.target.value })}><option value="student">Student</option><option value="teacher">Teacher</option></select></Field>
              <Button variant="primary" loading={busy}>Create account</Button>
            </form>
          </Card>
          <Card title="Create a classroom" subtitle={teachers.length === 0 ? "Create a teacher account first — every classroom needs a teacher." : "Assign one teacher to each classroom."}>
            <form className="sk-form" onSubmit={addRoom}>
              <Field label="Classroom name"><input className="sk-input" required minLength={2} placeholder="e.g. Class 8 – Section A" value={room.name} onChange={(e) => setRoom({ ...room, name: e.target.value })} /></Field>
              <Field label="Class teacher"><select className="sk-select" required value={room.teacher_id} onChange={(e) => setRoom({ ...room, teacher_id: e.target.value })}>
                <option value="">Choose a teacher…</option>{teachers.map((t) => <option key={t.id} value={t.id}>{t.full_name}</option>)}</select></Field>
              <Button variant="primary" loading={busy} disabled={!teachers.length}>Create classroom</Button>
            </form>
          </Card>
        </div>
      )}
      {error && !ready && <Link href="/login">Sign in again</Link>}
    </Page>
  );
}
