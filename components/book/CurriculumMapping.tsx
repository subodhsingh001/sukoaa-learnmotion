"use client";
import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/learning-api";
import { useAuth } from "@/lib/auth-context";
import { Badge, Button, Card } from "@/components/ui/kit";

type Suggestion = { topic: string; score: number; catalog_status: string };
type Mapping = { topic: string; status: string; source: string } | null;
type Chapter = { id: number; number: number; title: string; mapping: Mapping; suggestions: Suggestion[] };
type Response = { board: string | null; grade: number; subject: string; catalog_is_official: boolean; chapters: Chapter[] };

export default function CurriculumMapping({ bookId }: { bookId: string }) {
  const { user } = useAuth();
  const [data, setData] = useState<Response | null>(null);
  const [edits, setEdits] = useState<Record<number, string>>({});
  const [statuses, setStatuses] = useState<Record<number, string>>({});
  const [saving, setSaving] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const canEdit = user?.role === "admin" || user?.role === "teacher";
  const load = useCallback(async () => {
    const result = await api<Response>(`/textbooks/${bookId}/curriculum-mapping`);
    setData(result);
    setEdits(Object.fromEntries(result.chapters.map((c) => [c.id, c.mapping?.topic ?? ""])));
    setStatuses(Object.fromEntries(result.chapters.map((c) => [c.id, c.mapping?.status ?? "draft"])));
  }, [bookId]);
  useEffect(() => { void load().catch((e) => setError(e.message)); }, [load]);

  const save = async (id: number) => {
    setError(""); setMessage(""); setSaving(id);
    try {
      await api(`/textbooks/${bookId}/curriculum-mapping/${id}`, {
        method: "PUT",
        body: JSON.stringify({ topic: (edits[id] ?? "").trim(), status: statuses[id] ?? "draft" }),
      });
      await load();
      setMessage(`Chapter mapping saved.`);
    } catch (e) { setError(e instanceof Error ? e.message : "Could not save mapping"); }
    finally { setSaving(null); }
  };
  return <Card title="Curriculum Mapping" subtitle={`${data?.board ?? "Board not recognized"} · Class ${data?.grade ?? "—"} · ${data?.subject ?? ""}`}>
    <p style={{ marginBottom: 12, fontSize: 13, color: "var(--sk-muted, #64748b)" }}>Catalog suggestions are starter references, not verified official CBSE/CISCE syllabus mappings. Review each topic before marking it reviewed. This does not change chapter publishing.</p>
    {error && <div className="sk-alert warn" role="alert">{error}</div>}
    {message && <div className="sk-alert success" role="status">{message}</div>}
    {!data ? <p>Loading curriculum mappings…</p> : data.chapters.length === 0 ? <p>No chapters available.</p> :
      <div className="sk-table-wrap"><table className="sk-table"><thead><tr><th>Chapter</th><th>Curriculum topic</th><th>Review</th><th>Action</th></tr></thead><tbody>
        {data.chapters.map((chapter) => <tr key={chapter.id}>
          <td style={{ minWidth: 180 }}><strong>{chapter.number}. {chapter.title}</strong><div style={{ marginTop: 6 }}><Badge>{chapter.mapping?.status ?? "unmapped"}</Badge></div></td>
          <td style={{ minWidth: 260 }}>
            <input className="sk-input" aria-label={`Curriculum topic for ${chapter.title}`} value={edits[chapter.id] ?? ""} maxLength={220} disabled={!canEdit} onChange={(e) => setEdits((prev) => ({ ...prev, [chapter.id]: e.target.value }))} placeholder="Enter curriculum topic" />
            {canEdit && chapter.suggestions.length > 0 && <div style={{ marginTop: 6, fontSize: 12 }}>
              <label htmlFor={`suggest-${chapter.id}`}>Starter catalog suggestions: </label>
              <select id={`suggest-${chapter.id}`} className="sk-input" defaultValue="" onChange={(e) => { if (e.target.value) setEdits((prev) => ({ ...prev, [chapter.id]: e.target.value })); }}>
                <option value="">Choose a suggestion (optional)</option>
                {chapter.suggestions.map((s) => <option key={s.topic} value={s.topic}>{s.topic} · {Math.round(s.score * 100)}% title similarity</option>)}
              </select>
            </div>}
          </td>
          <td>{canEdit ? <select className="sk-input" aria-label={`Review status for ${chapter.title}`} value={statuses[chapter.id] ?? "draft"} onChange={(e) => setStatuses((prev) => ({ ...prev, [chapter.id]: e.target.value }))}><option value="draft">Draft</option><option value="reviewed">Reviewed</option></select> : (chapter.mapping?.status ?? "—")}</td>
          <td>{canEdit && <Button size="sm" disabled={saving !== null || (edits[chapter.id] ?? "").trim().length < 2} onClick={() => void save(chapter.id)}>{saving === chapter.id ? "Saving…" : "Save"}</Button>}</td>
        </tr>)}
      </tbody></table></div>}
  </Card>;
}
