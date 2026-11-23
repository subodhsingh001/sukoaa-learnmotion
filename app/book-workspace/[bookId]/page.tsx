"use client";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { BookOpen, CheckCheck, RefreshCw, Rocket, ScanSearch } from "lucide-react";
import { api } from "@/lib/learning-api";
import { useAuth } from "@/lib/auth-context";
import { Badge, Button, Card, Empty, Field, Loading, Page, PageHeader, Pager, useFlash } from "@/components/ui/kit";
import { statusTone } from "@/lib/format";

type Chapter = { id: number; number: number; title: string; status: string; printed_start: number | null; printed_end: number | null; source_available: boolean; assets: { id: number; kind: string; status: string }[] };
type Book = { title: string; board: string; grade: number; subject: string; extraction_status: string };

export default function BookChapters() {
  const { bookId } = useParams<{ bookId: string }>();
  const { user } = useAuth();
  const { busy, run, flash, setError } = useFlash();
  const [book, setBook] = useState<Book | null>(null);
  const [chapters, setChapters] = useState<Chapter[] | null>(null);
  const [page, setPage] = useState(1);
  const [showAdd, setShowAdd] = useState(false);
  const [draft, setDraft] = useState({ number: "", title: "" });

  const load = useCallback(async () => {
    const d = await api<{ book: Book; chapters: Chapter[] }>(`/textbooks/${bookId}/chapter-workspace`);
    setBook(d.book); setChapters(d.chapters);
  }, [bookId]);
  useEffect(() => { if (user) load().catch((e) => { setError(e.message); setChapters([]); }); }, [user, load, setError]);

  const list = chapters ?? [];
  const pages = Math.max(1, Math.ceil(list.length / 12)); const current = Math.min(page, pages);
  const drafts = list.filter((c) => c.status === "draft"); const reviewed = list.filter((c) => c.status === "reviewed");

  const bulk = (action: "review" | "publish", ids: number[]) => {
    if (!confirm(`${action === "review" ? "Mark as reviewed" : "Publish"} ${ids.length} chapter(s)? Please check titles and page ranges first.`)) return;
    void run(async () => { await api(`/textbooks/${bookId}/chapters/bulk-review`, { method: "POST", body: JSON.stringify({ chapter_ids: ids, action }) }); await load(); },
      action === "review" ? "Chapters marked as reviewed." : "Chapters published to students.");
  };
  const detect = () => void run(async () => { const r = await api<{ detected: number; added: number }>(`/textbooks/${bookId}/detect-chapters`, { method: "POST" }); await load();
    if (!r.detected) throw new Error("No numbered contents page was found in this PDF. Add chapters manually instead."); }, "Contents scanned: new chapters were added as drafts.");
  const sync = () => void run(async () => { await api(`/textbooks/${bookId}/sync-chapter-pages`, { method: "POST" }); await load(); }, "Titles and page ranges refreshed from the contents page.");
  const addChapter = (e: FormEvent) => { e.preventDefault();
    void run(async () => { await api(`/textbooks/${bookId}/chapters`, { method: "POST", body: JSON.stringify({ number: Number(draft.number), title: draft.title }) }); setDraft({ number: "", title: "" }); setShowAdd(false); await load(); }, "Chapter added as a draft."); };

  return (
    <Page>
      <PageHeader back={{ href: "/book-workspace", label: "Book library" }} title={book?.title ?? "Book"} subtitle={book ? `${book.board} · Class ${book.grade} · ${book.subject}` : undefined}
        actions={book && <><Link href={`/book-workspace/${bookId}/read`} className="sk-btn sk-btn-primary"><BookOpen size={16} /> Read Book</Link><Badge tone={statusTone(book.extraction_status)}>{book.extraction_status.replace(/_/g, " ")}</Badge></>} />
      {flash}
      {book?.extraction_status === "needs_ocr" && <div className="sk-alert warn">This PDF looks scanned. Chapter text will be read with OCR when you extract each chapter — make sure OCR is ready on the <Link href="/textbooks" style={{ textDecoration: "underline" }}>upload page</Link>.</div>}
      <Card title={`Chapters${chapters ? ` (${list.length})` : ""}`} subtitle="Open a chapter to verify its pages, extract its text and create learning material."
        actions={<>
          <Button size="sm" onClick={detect} disabled={busy}><ScanSearch size={15} />Detect from contents</Button>
          <Button size="sm" onClick={sync} disabled={busy}><RefreshCw size={15} />Refresh pages</Button>
          <Button size="sm" onClick={() => setShowAdd((v) => !v)}>+ Add chapter</Button>
        </>} flush>
        {showAdd && <form onSubmit={addChapter} className="sk-card-body" style={{ borderBottom: "1px solid var(--sk-border)", background: "#fafbfe" }}>
          <div className="sk-form cols" style={{ alignItems: "end" }}>
            <Field label="Chapter number"><input className="sk-input" type="number" min={1} max={500} required value={draft.number} onChange={(e) => setDraft({ ...draft, number: e.target.value })} /></Field>
            <Field label="Chapter title"><input className="sk-input" required minLength={2} value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} /></Field>
            <Button variant="primary" loading={busy}>Add as draft</Button></div></form>}
        {chapters === null ? <Loading /> : list.length === 0 ? <Empty title="No chapters yet" text="Detect chapters from the book’s contents page, or add them manually." /> : <>
          <div className="sk-table-wrap"><table className="sk-table"><thead><tr><th style={{ width: 60 }}>No.</th><th>Chapter</th><th>Printed pages</th><th>Text</th><th>Material</th><th>Status</th></tr></thead><tbody>
            {list.slice((current - 1) * 12, current * 12).map((c) => <tr key={c.id}>
              <td><b>{c.number}</b></td>
              <td><Link className="sk-link-strong" href={`/book-workspace/${bookId}/chapters/${c.id}`}>{c.title}</Link></td>
              <td>{c.printed_start ? `${c.printed_start}–${c.printed_end ?? "end"}` : <Badge tone="warn">Verify</Badge>}</td>
              <td>{c.source_available ? <Badge tone="success">Extracted</Badge> : <Badge>Not yet</Badge>}</td>
              <td>{c.assets.length ? `${c.assets.length} item${c.assets.length > 1 ? "s" : ""}` : "—"}</td>
              <td><Badge tone={statusTone(c.status)}>{c.status}</Badge></td></tr>)}
          </tbody></table></div>
          <Pager page={current} pages={pages} onPage={setPage} />
        </>}
      </Card>
      {(drafts.length > 0 || (reviewed.length > 0 && user?.role === "admin")) && (
        <Card title="Bulk review" subtitle="Move many chapters through the approval workflow at once.">
          <div className="sk-actions">
            <Button disabled={busy || !drafts.length} onClick={() => bulk("review", drafts.map((c) => c.id))}><CheckCheck size={16} />Mark {drafts.length} draft chapter(s) reviewed</Button>
            {user?.role === "admin" && <Button variant="primary" disabled={busy || !reviewed.length} onClick={() => bulk("publish", reviewed.map((c) => c.id))}><Rocket size={16} />Publish {reviewed.length} reviewed chapter(s)</Button>}
          </div>
        </Card>
      )}
    </Page>
  );
}
