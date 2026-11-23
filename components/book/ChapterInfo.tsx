"use client";
import { useState } from "react";
import Link from "next/link";
import { FileText, Save, Sparkles } from "lucide-react";
import { api } from "@/lib/learning-api";
import { Badge, Button, Card, Field, useFlash } from "@/components/ui/kit";
import { statusTone } from "@/lib/format";
import type { Chapter } from "./types";

export default function ChapterInfo({ bookId, chapter, role, reload }: { bookId: number; chapter: Chapter; role: string; reload: () => Promise<void> }) {
  const { busy, run, flash } = useFlash();
  const [title, setTitle] = useState(chapter.title);
  const [start, setStart] = useState(String(chapter.printed_start ?? ""));
  const [end, setEnd] = useState(String(chapter.printed_end ?? ""));
  const [offset, setOffset] = useState(String(chapter.pdf_offset ?? 0));
  const [showText, setShowText] = useState(false);
  const base = `/textbooks/${bookId}/chapters/${chapter.id}`;
  const pdfStart = chapter.printed_start != null ? chapter.printed_start + (chapter.pdf_offset ?? 0) : null;
  const pdfEnd = chapter.printed_end != null ? chapter.printed_end + (chapter.pdf_offset ?? 0) : null;
  const readerUrl = `/book-workspace/${bookId}/read${pdfStart && pdfStart > 0 ? `?page=${pdfStart}${pdfEnd != null && pdfEnd >= pdfStart ? `&end=${pdfEnd}` : ""}` : ""}`;
  const put = (path: string, body: object, ok: string) => run(async () => { await api(base + path, { method: "PUT", body: JSON.stringify(body) }); await reload(); }, ok);

  return (
    <div className="sk-grid">
      {flash}
      <Card title="Chapter details" actions={<Badge tone={statusTone(chapter.status)}>{chapter.status}</Badge>}>
        <div className="sk-form">
          <Field label="Chapter title"><input className="sk-input" value={title} onChange={(e) => setTitle(e.target.value)} /></Field>
          <div className="sk-actions">
            <Button variant="primary" loading={busy} disabled={title.trim().length < 2 || title === chapter.title} onClick={() => put("", { title }, "Chapter saved.")}><Save size={15} />Save title</Button>
            {chapter.status === "draft" && <Button disabled={busy} onClick={() => put("", { status: "reviewed" }, "Chapter marked as reviewed.")}>Mark reviewed</Button>}
            {chapter.status === "reviewed" && role === "admin" && <Button variant="primary" disabled={busy} onClick={() => put("", { status: "published" }, "Chapter published to students.")}>Publish chapter</Button>}
            {chapter.status === "published" && role === "admin" && <Button disabled={busy} onClick={() => put("", { status: "draft" }, "Chapter moved back to draft.")}>Unpublish</Button>}
          </div>
        </div>
      </Card>

      <Card title="Read this chapter" subtitle="Open the original textbook at this chapter’s starting page, with page turning and read-aloud controls.">
        <div className="sk-actions">
          <Link href={readerUrl} className="sk-btn sk-btn-primary">📖 Read chapter like a book</Link>
          <Link href={`/book-workspace/${bookId}/read`} className="sk-btn">Open full textbook</Link>
        </div>
        {pdfStart == null ? <p className="sk-note">Verify the chapter start page and PDF offset to open directly at the correct page.</p> :
          <p style={{ fontSize: 13, color: "var(--sk-muted)" }}>Reads PDF pages {pdfStart}–{pdfEnd ?? "end of book"}. Includes flipbook, fullscreen, page navigation and narration.</p>}
      </Card>
      <Card title="Pages &amp; text" subtitle="Pages come from the book’s contents. Correct them only if they are wrong, then extract the text.">
        <div className="sk-form cols">
          <Field label="First printed page"><input className="sk-input" type="number" min={1} value={start} onChange={(e) => setStart(e.target.value)} /></Field>
          <Field label="Last printed page" hint="Leave empty to read the last chapter through the end of the PDF."><input className="sk-input" type="number" min={1} value={end} onChange={(e) => setEnd(e.target.value)} /></Field>
          <Field label="PDF page offset" hint="PDF page = printed page + offset."><input className="sk-input" type="number" value={offset} onChange={(e) => setOffset(e.target.value)} /></Field>
        </div>
        <div className="sk-actions" style={{ marginTop: 16 }}>
          <Button disabled={busy || !start} onClick={() => put("/pages", { printed_start: Number(start), printed_end: end ? Number(end) : null, pdf_offset: Number(offset) || 0 }, "Page range saved. Extract the text again.")}>Save pages</Button>
          <Button variant="primary" loading={busy} onClick={() => run(async () => { await api(`${base}/extract`, { method: "POST" }); await reload(); setShowText(true); }, "Chapter text extracted.")}><FileText size={15} />Extract chapter text</Button>
        </div>
        <p style={{ fontSize: 13, color: "var(--sk-muted)", margin: "14px 0 0" }}>
          {chapter.source_available ? <>Text is ready ({chapter.source_text.length.toLocaleString()} characters). <Sparkles size={13} style={{ verticalAlign: "-2px" }} /> You can now create AI material in the <b>Learning material</b> tab.</> : "Text has not been extracted yet. Extract it before generating notes or quizzes."}
        </p>
        {chapter.source_text && <div style={{ marginTop: 10 }}>
          <Button size="sm" onClick={() => setShowText((v) => !v)}>{showText ? "Hide" : "Show"} extracted text</Button>
          {showText && <section aria-label="Chapter text preview" style={{ marginTop: 12, border: "1px solid var(--sk-border)", borderRadius: 14, background: "#fff", overflow: "hidden" }}>
            <header style={{ padding: "14px 20px", borderBottom: "1px solid var(--sk-border)", background: "#f8fafc" }}>
              <strong>Chapter {chapter.number}: {chapter.title}</strong>
              <p style={{ margin: "4px 0 0", fontSize: 12, color: "#64748b" }}>Extracted text · {chapter.source_text.length.toLocaleString()} characters</p>
            </header>
            <article style={{ maxWidth: 820, margin: "0 auto", padding: "24px clamp(16px, 5vw, 48px)", maxHeight: "70vh", overflowY: "auto", fontFamily: "Georgia, serif", fontSize: 17, lineHeight: 1.9, color: "#1e293b", whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{chapter.source_text}</article>
            <footer style={{ padding: "12px 20px", borderTop: "1px solid var(--sk-border)" }}><Link href={readerUrl} className="sk-btn sk-btn-primary">Read original PDF as a book</Link></footer>
          </section>}
        </div>}
      </Card>
    </div>
  );
}
