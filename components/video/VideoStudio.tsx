"use client";
import { useState } from "react";
import { Film, Rocket, Save, Sparkles } from "lucide-react";
import { api } from "@/lib/learning-api";
import { Badge, Button, Card, Empty, Field, useFlash } from "@/components/ui/kit";
import { statusTone } from "@/lib/format";
import { parseStoryboard, type Storyboard } from "@/lib/storyboard";
import type { Asset, Chapter } from "@/components/book/types";
import StoryboardPlayer from "./StoryboardPlayer";

function Lesson({ asset, role, busy, onStatus, onSave }: { asset: Asset; role: string; busy: boolean; onStatus: (s: string) => void; onSave: (board: Storyboard) => void }) {
  const board = parseStoryboard(asset.body);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Storyboard | null>(board);
  if (!board || !draft) return <div className="sk-alert warn">“{asset.title}” cannot be read as an animated lesson.</div>;
  const edit = (i: number, patch: Partial<Storyboard["scenes"][number]>) => setDraft({ ...draft, scenes: draft.scenes.map((s, k) => (k === i ? { ...s, ...patch } : s)) });
  const dirty = JSON.stringify(draft) !== JSON.stringify(board);
  return (
    <div className="sk-card" style={{ boxShadow: "none" }}>
      <div className="sk-list-item">
        <div style={{ flex: 1 }}><b>{asset.title}</b><span className="sk-sub">{board.scenes.length} scenes · {board.language.toUpperCase()}</span></div>
        <Badge tone={statusTone(asset.status)}>{asset.status}</Badge>
        <Button size="sm" onClick={() => setOpen((v) => !v)}><Film size={14} />{open ? "Close" : "Preview & edit"}</Button>
        {asset.status === "draft" && <Button size="sm" variant="primary" disabled={busy || dirty} onClick={() => onStatus("reviewed")}>Mark reviewed</Button>}
        {asset.status === "reviewed" && role === "admin" && <Button size="sm" variant="primary" disabled={busy} onClick={() => onStatus("published")}><Rocket size={14} />Publish</Button>}
      </div>
      {open && (
        <div className="sk-card-body" style={{ borderTop: "1px solid var(--sk-border)", display: "grid", gap: 20 }}>
          <StoryboardPlayer key={JSON.stringify(board)} storyboard={board} />
          <div>
            <h3 style={{ margin: "0 0 4px", fontSize: 15 }}>Check every scene before approving</h3>
            <p style={{ margin: "0 0 12px", fontSize: 13, color: "var(--sk-muted)" }}>Fix any wrong narration. Changing a published lesson sends it back to draft.</p>
            <div className="sk-grid">{draft.scenes.map((s, i) => (
              <div className="sk-q" key={i}>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}><Badge tone="primary">Scene {i + 1}</Badge><Badge>{s.template.replace(/_/g, " ")}</Badge></div>
                <textarea className="sk-textarea" rows={2} aria-label={`Narration for scene ${i + 1}`} value={s.narration} onChange={(e) => edit(i, { narration: e.target.value })} />
                <Field label="Seconds"><input className="sk-input" style={{ maxWidth: 110 }} type="number" min={4} max={30} value={s.seconds} onChange={(e) => edit(i, { seconds: Number(e.target.value) || 6 })} /></Field>
              </div>))}</div>
            <div style={{ marginTop: 14 }}><Button variant="primary" disabled={!dirty || busy} onClick={() => onSave(draft)}><Save size={15} />Save changes</Button></div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function VideoStudio({ bookId, chapter, role, reload }: { bookId: number; chapter: Chapter; role: string; reload: () => Promise<void> }) {
  const { busy, run, flash } = useFlash();
  const [scenes, setScenes] = useState("6");
  const [language, setLanguage] = useState("en");
  const base = `/textbooks/${bookId}/chapters/${chapter.id}`;
  const items = chapter.assets.filter((a) => a.kind === "video");
  const generate = () => run(async () => { await api(`/ai/chapters/${chapter.id}/storyboard`, { method: "POST", body: JSON.stringify({ scenes: Number(scenes), language }) }); await reload(); },
    "Animated lesson created as a draft. Preview it and check every scene.");
  const setStatus = (a: Asset, status: string) => run(async () => { await api(`${base}/assets/${a.id}`, { method: "PUT", body: JSON.stringify({ status }) }); await reload(); }, status === "published" ? "Published to students." : "Marked as reviewed.");
  const save = (a: Asset, board: Storyboard) => run(async () => { await api(`${base}/assets/${a.id}`, { method: "PUT", body: JSON.stringify({ body: JSON.stringify(board) }) }); await reload(); }, "Lesson saved.");

  return (
    <>
      {flash}
      <Card title="Create animated lesson" subtitle="The AI plans scenes and picks 2D/3D templates from the chapter text. You review before students see it.">
        {!chapter.source_available ? <div className="sk-alert warn">Extract this chapter’s text first (Chapter information → Extract chapter text).</div> :
          <div className="sk-form cols" style={{ alignItems: "end" }}>
            <Field label="Number of scenes"><select className="sk-select" value={scenes} onChange={(e) => setScenes(e.target.value)}>{[4, 5, 6, 8, 10].map((n) => <option key={n}>{n}</option>)}</select></Field>
            <Field label="Narration language" hint="Hindi/Bengali need AI (API key)."><select className="sk-select" value={language} onChange={(e) => setLanguage(e.target.value)}><option value="en">English</option><option value="hi">Hindi</option><option value="bn">Bengali</option></select></Field>
            <Button variant="primary" loading={busy} onClick={() => void generate()}><Sparkles size={16} />Create lesson</Button>
          </div>}
      </Card>
      <Card title="Animated lessons" flush>
        {items.length === 0 ? <Empty icon={<Film size={22} />} title="No animated lessons yet" text="Create one above. It plays in the browser with narration and captions." /> :
          <div className="sk-grid" style={{ padding: 16 }}>{items.map((a) => <Lesson key={a.id} asset={a} role={role} busy={busy} onStatus={(s) => void setStatus(a, s)} onSave={(b) => void save(a, b)} />)}</div>}
      </Card>
    </>
  );
}
