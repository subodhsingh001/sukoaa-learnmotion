"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/learning-api";
import { Badge, Card, Empty, Loading, Page, PageHeader, Pager, Switch, useFlash } from "@/components/ui/kit";

type Teacher = { id: number; name: string; email: string; permissions: string[] };
type Room = { id: number; name: string; teacher_id: number };
const PERMISSIONS = [
  { key: "books.upload", label: "Upload books", hint: "Add and edit textbooks" },
  { key: "chapters.edit", label: "Edit chapters", hint: "Page ranges, extraction, review" },
  { key: "content.generate", label: "AI content", hint: "Generate notes, Q&A, quizzes" },
  { key: "content.publish", label: "Publish", hint: "Make content visible to students" },
];

export default function TeachersPage() {
  const { busy, run, flash, setError } = useFlash();
  const [teachers, setTeachers] = useState<Teacher[] | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    const [t, r] = await Promise.all([api<Teacher[]>("/textbooks/permissions/teachers"), api<Room[]>("/school/classrooms")]);
    setTeachers(t); setRooms(r);
  }, []);
  useEffect(() => { load().catch((e) => { setError(e.message); setTeachers([]); }); }, [load, setError]);

  const classesOf = useCallback((id: number) => rooms.filter((r) => r.teacher_id === id).map((r) => r.name), [rooms]);
  const filtered = useMemo(() => (teachers ?? []).filter((t) => `${t.name} ${t.email} ${classesOf(t.id).join(" ")}`.toLowerCase().includes(query.toLowerCase())), [teachers, query, classesOf]);
  const pages = Math.max(1, Math.ceil(filtered.length / 10));
  const current = Math.min(page, pages);

  const toggle = (t: Teacher, key: string, on: boolean) => void run(async () => {
    const next = on ? [...t.permissions, key] : t.permissions.filter((p) => p !== key);
    await api(`/textbooks/permissions/teachers/${t.id}`, { method: "PUT", body: JSON.stringify({ permissions: next }) });
    await load();
  }, "Permissions updated.");

  return (
    <Page>
      <PageHeader back={{ href: "/school-admin", label: "School administration" }} title="Teachers & permissions"
        subtitle="Decide what each teacher may do with books and learning content. Changes apply immediately." />
      {flash}
      <Card flush>
        <div className="sk-card-head"><div className="sk-toolbar" style={{ width: "100%" }}>
          <input className="sk-input" aria-label="Search teachers" placeholder="Search name, email or class" value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} />
          <span style={{ color: "var(--sk-muted)", fontSize: 13 }}>{filtered.length} teacher{filtered.length === 1 ? "" : "s"}</span>
        </div></div>
        {teachers === null ? <Loading /> : filtered.length === 0 ? <Empty title="No teachers found" text="Create teacher accounts from School administration → Add new." /> :
          <div className="sk-table-wrap"><table className="sk-table"><thead><tr><th>Teacher</th><th>Classes</th>{PERMISSIONS.map((p) => <th key={p.key} title={p.hint}>{p.label}</th>)}</tr></thead><tbody>
            {filtered.slice((current - 1) * 10, current * 10).map((t) => {
              const classes = classesOf(t.id);
              return <tr key={t.id}>
                <td><b>{t.name}</b><span className="sk-sub">{t.email}</span></td>
                <td>{classes.length ? classes.map((c) => <Badge key={c} tone="primary">{c}</Badge>) : <span style={{ color: "var(--sk-faint)" }}>Not assigned</span>}</td>
                {PERMISSIONS.map((p) => <td key={p.key}><Switch label={`${p.label} for ${t.name}`} checked={t.permissions.includes(p.key)} disabled={busy} onChange={(v) => toggle(t, p.key, v)} /></td>)}
              </tr>;
            })}
          </tbody></table></div>}
        <Pager page={current} pages={pages} onPage={setPage} />
      </Card>
    </Page>
  );
}
