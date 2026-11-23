"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { LibraryBig, Pencil, Plus, Trash2 } from "lucide-react";
import { api } from "@/lib/learning-api";
import { useAuth } from "@/lib/auth-context";
import { Badge, Button, Card, Empty, Field, LinkButton, Loading, Page, PageHeader, Pager, useFlash } from "@/components/ui/kit";
import { statusLabel, statusTone } from "@/lib/format";

type Book = { id: number; title: string; board: string; grade: number; subject: string; edition: string; extraction_status: string };

export default function BookLibrary() {
  const { user } = useAuth();
  const { busy, run, flash, setError } = useFlash();
  const [books, setBooks] = useState<Book[] | null>(null);
  const [q, setQ] = useState(""); const [board, setBoard] = useState(""); const [grade, setGrade] = useState(""); const [subject, setSubject] = useState("");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Book | null>(null);

  const reload = useCallback(() => api<Book[]>("/textbooks").then(setBooks).catch((e) => { setError(e.message); setBooks([]); }), [setError]);
  useEffect(() => { if (user) void reload(); }, [user, reload]);

  const filtered = useMemo(() => (books ?? []).filter((b) => (!board || b.board === board) && (!grade || String(b.grade) === grade) && (!subject || b.subject === subject)
    && `${b.title} ${b.subject}`.toLowerCase().includes(q.toLowerCase())), [books, board, grade, subject, q]);
  const pages = Math.max(1, Math.ceil(filtered.length / 10)); const current = Math.min(page, pages);
  const filt = (set: (v: string) => void) => (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => { set(e.target.value); setPage(1); };
  const isAdmin = user?.role === "admin";

  const save = (e: React.FormEvent) => { e.preventDefault(); if (!editing) return;
    void run(async () => { await api(`/textbooks/${editing.id}`, { method: "PUT", body: JSON.stringify(editing) }); setEditing(null); await reload(); }, "Book updated."); };
  const remove = (b: Book) => { if (!confirm(`Delete “${b.title}”? Books that already contain chapters cannot be deleted.`)) return;
    void run(async () => { await api(`/textbooks/${b.id}`, { method: "DELETE" }); await reload(); }, "Book deleted."); };

  return (
    <Page>
      <PageHeader title="Book library" subtitle="All textbooks for your school. Open a book to manage its chapters and learning material."
        actions={<LinkButton variant="primary" href="/textbooks"><Plus size={16} />Upload textbook</LinkButton>} />
      {flash}
      {editing && (
        <Card title="Edit book" actions={<Button size="sm" onClick={() => setEditing(null)}>Cancel</Button>}>
          <form className="sk-form cols" onSubmit={save}>
            <Field label="Title" wide><input className="sk-input" required value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} /></Field>
            <Field label="Subject"><input className="sk-input" required value={editing.subject} onChange={(e) => setEditing({ ...editing, subject: e.target.value })} /></Field>
            <Field label="Edition"><input className="sk-input" value={editing.edition} onChange={(e) => setEditing({ ...editing, edition: e.target.value })} /></Field>
            <Field label="Board"><select className="sk-select" value={editing.board} onChange={(e) => setEditing({ ...editing, board: e.target.value })}><option>CBSE</option><option>ICSE</option></select></Field>
            <Field label="Class"><select className="sk-select" value={editing.grade} onChange={(e) => setEditing({ ...editing, grade: Number(e.target.value) })}>{Array.from({ length: 12 }, (_, i) => <option key={i} value={i + 1}>Class {i + 1}</option>)}</select></Field>
            <div className="sk-field wide"><Button variant="primary" loading={busy}>Save changes</Button></div>
          </form>
        </Card>
      )}
      <Card flush>
        <div className="sk-card-head"><div className="sk-toolbar" style={{ width: "100%" }}>
          <input className="sk-input" placeholder="Search books" aria-label="Search books" value={q} onChange={filt(setQ)} />
          <select className="sk-select" aria-label="Board" value={board} onChange={filt(setBoard)}><option value="">All boards</option><option>CBSE</option><option>ICSE</option></select>
          <select className="sk-select" aria-label="Class" value={grade} onChange={filt(setGrade)}><option value="">All classes</option>{Array.from({ length: 12 }, (_, i) => <option key={i} value={i + 1}>Class {i + 1}</option>)}</select>
          <select className="sk-select" aria-label="Subject" value={subject} onChange={filt(setSubject)}><option value="">All subjects</option>{[...new Set((books ?? []).map((b) => b.subject))].sort().map((s) => <option key={s}>{s}</option>)}</select>
        </div></div>
        {books === null ? <Loading /> : filtered.length === 0 ? (
          <Empty icon={<LibraryBig size={22} />} title={books.length ? "No books match your filters" : "No textbooks yet"} text={books.length ? undefined : "Upload your first PDF textbook to begin."}
            action={!books.length && <LinkButton variant="primary" href="/textbooks">Upload textbook</LinkButton>} />
        ) : (
          <div className="sk-table-wrap"><table className="sk-table"><thead><tr><th>Book</th><th>Board</th><th>Class</th><th>Text status</th><th style={{ textAlign: "right" }}>Actions</th></tr></thead><tbody>
            {filtered.slice((current - 1) * 10, current * 10).map((b) => <tr key={b.id}>
              <td><Link className="sk-link-strong" href={`/book-workspace/${b.id}`}>{b.title}</Link><span className="sk-sub">{b.subject}{b.edition ? ` · ${b.edition}` : ""}</span></td>
              <td>{b.board}</td><td>{b.grade}</td>
              <td><Badge tone={statusTone(b.extraction_status)}>{statusLabel(b.extraction_status)}</Badge></td>
              <td><div className="sk-actions" style={{ justifyContent: "flex-end" }}>
                <LinkButton size="sm" href={`/book-workspace/${b.id}`}>Open</LinkButton><LinkButton size="sm" href={`/book-workspace/${b.id}/read`}>Read Book</LinkButton>
                {isAdmin && <><Button size="sm" aria-label={`Edit ${b.title}`} onClick={() => setEditing(b)}><Pencil size={14} /></Button><Button size="sm" variant="danger" aria-label={`Delete ${b.title}`} onClick={() => remove(b)}><Trash2 size={14} /></Button></>}
              </div></td></tr>)}
          </tbody></table></div>
        )}
        <Pager page={current} pages={pages} onPage={setPage} />
      </Card>
    </Page>
  );
}
