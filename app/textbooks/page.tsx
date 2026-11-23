"use client";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, FileUp, XCircle } from "lucide-react";
import { api, API, getToken } from "@/lib/learning-api";
import { Badge, Button, Card, Field, Page, PageHeader, useFlash } from "@/components/ui/kit";
import { errMsg, statusLabel, statusTone } from "@/lib/format";

type Ocr = { ready: boolean; packages: Record<string, boolean>; tesseract_on_path: boolean; installation_hint: string };
type Recent = { id: number; title: string; board: string; grade: number; subject: string; extraction_status: string };

export default function UploadTextbook() {
  const router = useRouter();
  const { busy, setBusy, setError, flash } = useFlash();
  const [ocr, setOcr] = useState<Ocr | null>(null);
  const [recent, setRecent] = useState<Recent[]>([]);
  const [f, setF] = useState({ title: "", board: "CBSE", grade: "8", subject: "", edition: "" });
  const [file, setFile] = useState<File | null>(null);
  const [rights, setRights] = useState(false);

  useEffect(() => {
    api<Ocr>("/textbooks/ocr-status").then(setOcr).catch(() => setOcr(null));
    api<Recent[]>("/textbooks").then((b) => setRecent(b.slice(0, 5))).catch(() => undefined);
  }, []);

  async function upload(e: FormEvent) {
    e.preventDefault();
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) { setError("This PDF is larger than 20 MB. Split it into parts and upload each."); return; }
    setBusy(true); setError("");
    try {
      const form = new FormData();
      Object.entries({ ...f, rights_confirmed: String(rights) }).forEach(([k, v]) => form.append(k, v));
      form.append("file", file);
      const res = await fetch(`${API}/textbooks`, { method: "POST", headers: { Authorization: `Bearer ${getToken()}` }, body: form });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(typeof data.detail === "string" ? data.detail : "Upload failed.");
      router.push(`/book-workspace/${data.id}/read`);
    } catch (err) { setError(errMsg(err)); setBusy(false); }
  }

  return (
    <Page>
      <PageHeader title="Upload textbook" subtitle="Add an authorised PDF. We read the contents page and create draft chapters for you to verify." />
      {flash}
      <div className="sk-split">
        <Card title="Book details">
          <form className="sk-form cols" onSubmit={upload}>
            <Field label="Book title" wide><input className="sk-input" required value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="e.g. NCERT Science — Class 8" /></Field>
            <Field label="Board"><select className="sk-select" value={f.board} onChange={(e) => setF({ ...f, board: e.target.value })}><option value="CBSE">CBSE / NCERT</option><option value="ICSE">ICSE / ISC</option></select></Field>
            <Field label="Class"><select className="sk-select" value={f.grade} onChange={(e) => setF({ ...f, grade: e.target.value })}>{Array.from({ length: 12 }, (_, i) => <option key={i} value={i + 1}>Class {i + 1}</option>)}</select></Field>
            <Field label="Subject"><input className="sk-input" required value={f.subject} onChange={(e) => setF({ ...f, subject: e.target.value })} placeholder="Science" /></Field>
            <Field label="Edition / year"><input className="sk-input" value={f.edition} onChange={(e) => setF({ ...f, edition: e.target.value })} placeholder="Optional" /></Field>
            <Field label="PDF file" hint="Up to 20 MB, text or scanned." wide>
              <input className="sk-input" type="file" accept="application/pdf,.pdf" required onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            </Field>
            <label className="sk-check sk-field wide"><input type="checkbox" checked={rights} onChange={(e) => setRights(e.target.checked)} required />
              <span>I confirm my school has permission to upload and process this textbook.</span></label>
            <div className="sk-field wide"><Button variant="primary" loading={busy} disabled={!rights || !file}><FileUp size={16} />Upload &amp; detect chapters</Button></div>
          </form>
        </Card>
        <div className="sk-grid">
          <Card title="OCR readiness" subtitle="Needed only for scanned books">
            {!ocr ? <p style={{ margin: 0, color: "var(--sk-muted)", fontSize: 14 }}>OCR status is unavailable. Make sure you are signed in and the backend is running.</p> : <>
              <div style={{ display: "flex", gap: 8, alignItems: "center", fontWeight: 650 }}>
                {ocr.ready ? <CheckCircle2 color="#12805c" size={20} /> : <XCircle color="#b42343" size={20} />}{ocr.ready ? "OCR is ready" : "OCR unavailable — PDF reading still works"}</div>
              <div className="sk-chips" style={{ marginTop: 12 }}>
                {Object.entries(ocr.packages).map(([k, v]) => <Badge key={k} tone={v ? "success" : "danger"}>{k}</Badge>)}
                <Badge tone={ocr.tesseract_on_path ? "success" : "danger"}>tesseract</Badge></div>
              {!ocr.ready && <p style={{ fontSize: 12.5, color: "var(--sk-muted)", lineHeight: 1.55, marginBottom: 0 }}>OCR is optional for viewing and turning PDF pages. Scanned-image text extraction and narration require OCR. {ocr.installation_hint}</p>}
            </>}
          </Card>
          <Card title="Recently added" flush>
            {recent.length === 0 ? <p style={{ padding: 20, margin: 0, color: "var(--sk-muted)", fontSize: 14 }}>Nothing uploaded yet.</p> :
              recent.map((b) => <Link key={b.id} href={`/book-workspace/${b.id}`} className="sk-list-item" style={{ textDecoration: "none", color: "inherit" }}>
                <div style={{ flex: 1 }}><b style={{ fontSize: 14 }}>{b.title}</b><span className="sk-sub">{b.board} · Class {b.grade} · {b.subject}</span></div>
                <Badge tone={statusTone(b.extraction_status)}>{statusLabel(b.extraction_status)}</Badge></Link>)}
          </Card>
        </div>
      </div>
    </Page>
  );
}
