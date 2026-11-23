"use client";
import { useEffect, useState } from "react";
import { Eye, Pencil, Plus, Rocket, Sparkles } from "lucide-react";
import { api } from "@/lib/learning-api";
import { Badge, Button, Card, Empty, Field, Markdown, useFlash } from "@/components/ui/kit";
import { KIND_LABEL, parseQuestionSet, statusTone } from "@/lib/format";
import VideoStudio from "@/components/video/VideoStudio";
import { blankQuestion, type Asset, type Chapter, type Question } from "./types";

const KINDS = ["notes", "quiz", "qa", "exercise", "video"] as const;
const SINGULAR: Record<string, string> = { notes: "notes", qa: "Q&A set", quiz: "quiz", exercise: "exercise set" };

function AssetCard({ a, role, busy, onEdit, onStatus }: { a: Asset; role: string; busy: boolean; onEdit: () => void; onStatus: (s: string) => void }) {
  const [open, setOpen] = useState(false);
  const qs = a.kind === "notes" ? null : parseQuestionSet(a.body);
  return (
    <div className="sk-card" style={{ boxShadow: "none" }}>
      <div className="sk-list-item">
        <div style={{ flex: 1 }}><b>{a.title}</b><span className="sk-sub">{qs ? `${qs.questions.length} question${qs.questions.length === 1 ? "" : "s"}` : `${a.body.length.toLocaleString()} characters`}</span></div>
        <Badge tone={statusTone(a.status)}>{a.status}</Badge>
        <Button size="sm" onClick={() => setOpen((v) => !v)}><Eye size={14} />{open ? "Hide" : "View"}</Button>
        <Button size="sm" onClick={onEdit}><Pencil size={14} />Edit</Button>
        {a.status === "draft" && <Button size="sm" variant="primary" disabled={busy} onClick={() => onStatus("reviewed")}>Mark reviewed</Button>}
        {a.status === "reviewed" && role === "admin" && <Button size="sm" variant="primary" disabled={busy} onClick={() => onStatus("published")}><Rocket size={14} />Publish</Button>}
      </div>
      {open && <div className="sk-card-body" style={{ borderTop: "1px solid var(--sk-border)" }}>
        {a.kind === "notes" ? <Markdown text={a.body} /> : qs ? (
          <ol style={{ paddingLeft: 20, margin: 0, display: "grid", gap: 14 }}>{qs.questions.map((q, i) => <li key={i} style={{ lineHeight: 1.55 }}>
            {q.question}
            {q.options.some(Boolean) && <div style={{ display: "grid", gap: 3, marginTop: 6 }}>{q.options.filter(Boolean).map((o, j) =>
              <span key={j} style={{ fontSize: 13.5, color: j === q.correct_option ? "#0c5d43" : "var(--sk-muted)", fontWeight: j === q.correct_option ? 650 : 400 }}>{String.fromCharCode(65 + j)}. {o}{j === q.correct_option ? " ✓" : ""}</span>)}</div>}
            {q.answer && <div style={{ fontSize: 13, color: "var(--sk-muted)", marginTop: 4 }}><b>Answer:</b> {q.answer}</div>}
          </li>)}</ol>
        ) : <p style={{ whiteSpace: "pre-wrap", margin: 0 }}>{a.body}</p>}
      </div>}
    </div>
  );
}

export default function Materials({ bookId, chapter, role, reload }: { bookId: number; chapter: Chapter; role: string; reload: () => Promise<void> }) {
  const { busy, run, flash } = useFlash();
  const [kind, setKind] = useState<string>("notes");
  const [editing, setEditing] = useState<Asset | null>(null);
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [questions, setQuestions] = useState<Question[]>([blankQuestion()]);
  const [count, setCount] = useState("8");
  const [difficulty, setDifficulty] = useState("medium");
  const [usage, setUsage] = useState<{ used: number; limit: number; engine: string } | null>(null);
  const base = `/textbooks/${bookId}/chapters/${chapter.id}`;

  useEffect(() => { api<{ used: number; limit: number; engine: string }>("/ai/usage").then(setUsage).catch(() => setUsage(null)); }, [chapter.assets.length]);

  const items = chapter.assets.filter((a) => a.kind === kind);
  const close = () => { setEditing(null); setAdding(false); setTitle(""); setNotes(""); setQuestions([blankQuestion()]); };
  const edit = (a: Asset) => {
    setEditing(a); setAdding(true); setTitle(a.title);
    const qs = parseQuestionSet(a.body);
    if (qs) { setQuestions(qs.questions); setNotes(""); } else { setNotes(a.body); setQuestions([blankQuestion()]); }
  };
  const setQ = (i: number, patch: Partial<Question>) => setQuestions((v) => v.map((q, k) => (k === i ? { ...q, ...patch } : q)));

  const generate = () => run(async () => {
    const r = await api<{ engine: string }>(`/ai/chapters/${chapter.id}/generate`, { method: "POST", body: JSON.stringify({ kind, count: Number(count), difficulty }) });
    await reload();
    return r;
  }, "Draft created. Read it carefully, edit if needed, then mark it reviewed.");

  const setStatus = (a: Asset, status: string) => run(async () => { await api(`${base}/assets/${a.id}`, { method: "PUT", body: JSON.stringify({ status }) }); await reload(); }, status === "published" ? "Published to students." : "Marked as reviewed.");

  const save = (e: React.FormEvent) => { e.preventDefault();
    void run(async () => {
      if (kind === "notes") {
        if (editing) await api(`${base}/assets/${editing.id}`, { method: "PUT", body: JSON.stringify({ title, body: notes }) });
        else await api(`${base}/assets`, { method: "POST", body: JSON.stringify({ kind, title, body: notes }) });
      } else {
        const valid = questions.filter((q) => q.question.trim()).map((q) => ({ ...q, options: q.options.filter((o) => o.trim()) }));
        if (!valid.length) throw new Error("Add at least one question.");
        if (kind === "quiz" && valid.some((q) => q.options.length && q.correct_option === null)) throw new Error("Choose the correct option for every multiple-choice question.");
        if (editing) await api(`${base}/assets/${editing.id}`, { method: "PUT", body: JSON.stringify({ title, body: JSON.stringify({ format: "question_set_v1", questions: valid }) }) });
        else await api(`${base}/question-sets`, { method: "POST", body: JSON.stringify({ kind, title, questions: valid }) });
      }
      close(); await reload();
    }, "Saved.");
  };

  const canGenerate = chapter.source_available;
  return (
    <div className="sk-grid">
      {flash}
      <div className="sk-chips" role="group" aria-label="Material type">
        {KINDS.map((k) => <button key={k} className="sk-chip" aria-pressed={k === kind} onClick={() => { setKind(k); close(); }}>{KIND_LABEL[k]} · {chapter.assets.filter((a) => a.kind === k).length}</button>)}
      </div>

      {kind === "video" ? (
        <VideoStudio bookId={bookId} chapter={chapter} role={role} reload={reload} />
      ) : <>
        <Card title="Create with AI" subtitle={usage ? `${usage.used} of ${usage.limit} AI generations used this month · ${usage.engine === "claude" ? "Claude" : "offline demo generator"}` : undefined}>
          {!chapter.source_available ? <div className="sk-alert warn">Extract this chapter’s text first (Chapter information → Extract chapter text). AI only writes from verified chapter text.</div> : <>
            <div className="sk-form cols" style={{ alignItems: "end" }}>
              {kind !== "notes" && <Field label="How many questions"><input className="sk-input" type="number" min={3} max={20} value={count} onChange={(e) => setCount(e.target.value)} /></Field>}
              <Field label="Difficulty"><select className="sk-select" value={difficulty} onChange={(e) => setDifficulty(e.target.value)}><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option></select></Field>
              <Button variant="primary" loading={busy} disabled={!canGenerate} onClick={() => void generate()}><Sparkles size={16} />Generate {SINGULAR[kind]}</Button>
            </div>
            {usage?.engine === "offline" && <p style={{ fontSize: 12.5, color: "var(--sk-muted)", margin: "12px 0 0" }}>Using the built-in offline generator (simple fill-in-the-blank style). Add <code>ANTHROPIC_API_KEY</code> to the backend <code>.env</code> for full-quality AI content.</p>}
          </>}
        </Card>

        <Card title={KIND_LABEL[kind]} actions={!adding && <Button size="sm" onClick={() => setAdding(true)}><Plus size={15} />Write manually</Button>} flush>
          {items.length === 0 && !adding ? <Empty title={`No ${KIND_LABEL[kind].toLowerCase()} yet`} text="Generate a draft with AI or write one yourself." /> :
            <div className="sk-grid" style={{ padding: 16 }}>{items.map((a) => <AssetCard key={a.id} a={a} role={role} busy={busy} onEdit={() => edit(a)} onStatus={(s) => void setStatus(a, s)} />)}</div>}
        </Card>

        {adding && (
          <Card title={`${editing ? "Edit" : "New"} ${SINGULAR[kind]}`} actions={<Button size="sm" onClick={close}>Cancel</Button>}>
            <form className="sk-form" onSubmit={save}>
              <Field label="Title"><input className="sk-input" required value={title} placeholder="e.g. Practice set 1" onChange={(e) => setTitle(e.target.value)} /></Field>
              {kind === "notes" ? <Field label="Notes" hint="Markdown is supported: # headings, - bullets, **bold**."><textarea className="sk-textarea" required rows={10} value={notes} onChange={(e) => setNotes(e.target.value)} /></Field> : <>
                {questions.map((q, i) => (
                  <div className="sk-q" key={i}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}><b>Question {i + 1}</b>
                      <Button type="button" size="sm" variant="danger" disabled={questions.length === 1} onClick={() => setQuestions((v) => v.filter((_, k) => k !== i))}>Remove</Button></div>
                    <textarea className="sk-textarea" required rows={2} placeholder="Question" aria-label={`Question ${i + 1}`} value={q.question} onChange={(e) => setQ(i, { question: e.target.value })} />
                    {kind === "quiz" && <>
                      {q.options.map((o, j) => <div key={j} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <input type="radio" name={`correct-${i}`} aria-label={`Option ${j + 1} is correct`} checked={q.correct_option === j} disabled={!o.trim()} onChange={() => setQ(i, { correct_option: j })} style={{ accentColor: "var(--sk-primary)" }} />
                        <input className="sk-input" placeholder={`Option ${j + 1}`} value={o} onChange={(e) => setQ(i, { options: q.options.map((x, n) => (n === j ? e.target.value : x)) })} /></div>)}
                      <span className="sk-hint" style={{ fontSize: 12, color: "var(--sk-muted)" }}>Select the radio button beside the correct option.</span></>}
                    <textarea className="sk-textarea" rows={2} placeholder={kind === "quiz" ? "Explanation (shown after the student answers)" : "Answer / marking guide"}
                      value={kind === "quiz" ? q.explanation : q.answer} onChange={(e) => setQ(i, kind === "quiz" ? { explanation: e.target.value } : { answer: e.target.value })} />
                  </div>))}
                <div><Button type="button" onClick={() => setQuestions((v) => [...v, blankQuestion()])}><Plus size={15} />Add another question</Button></div></>}
              <div className="sk-actions"><Button variant="primary" loading={busy}>{editing ? "Save changes" : "Save as draft"}</Button><Button type="button" onClick={close}>Cancel</Button></div>
            </form>
          </Card>
        )}
      </>}
      {role !== "admin" && <p style={{ fontSize: 12.5, color: "var(--sk-muted)", margin: 0 }}>Only a school admin (or a teacher with publish permission) can publish reviewed content to students.</p>}
    </div>
  );
}
