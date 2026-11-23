"use client";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/learning-api";
import { Badge, Button, Card, Empty, Loading, Markdown, Page, PageHeader, Tabs, useFlash } from "@/components/ui/kit";
import StoryboardPlayer from "@/components/video/StoryboardPlayer";
import { parseStoryboard } from "@/lib/storyboard";
import { KIND_LABEL, parseQuestionSet, type QuestionSet } from "@/lib/format";

type Asset = { id: number; kind: string; title: string; body: string; best: { score: number; total: number } | null };
type Data = { chapter: { id: number; number: number; title: string; textbook_id: number }; assets: Asset[] };
type Result = { score: number; total: number; results: { graded: boolean; correct: boolean | null; correct_option: number | null; explanation: string }[] };
const ORDER = ["video", "notes", "quiz", "qa", "exercise"];

function Quiz({ asset, qs, onDone }: { asset: Asset; qs: QuestionSet; onDone: () => void }) {
  const { busy, run, flash } = useFlash();
  const [answers, setAnswers] = useState<(number | null)[]>(() => qs.questions.map(() => null));
  const [result, setResult] = useState<Result | null>(null);
  const submit = () => void run(async () => { setResult(await api<Result>(`/student/assets/${asset.id}/submit`, { method: "POST", body: JSON.stringify({ answers }) })); onDone(); });
  const answered = qs.questions.every((q, i) => q.options.length === 0 || answers[i] !== null);
  return (
    <Card title={asset.title} subtitle={asset.best ? `Best so far: ${asset.best.score}/${asset.best.total}` : "Choose one answer for each question."}>
      <div className="sk-grid">
        {flash}
        {result && <div className={`sk-alert ${result.score / result.total >= 0.6 ? "success" : "warn"}`}>You scored <b>{result.score} / {result.total}</b>.</div>}
        {qs.questions.map((q, i) => {
          const r = result && result.results[i]?.graded ? result.results[i] : null;
          return <div className="sk-q" key={i}>
            <b>{i + 1}. {q.question}</b>
            {q.options.map((o, j) => <button key={j} disabled={!!result} aria-pressed={answers[i] === j}
              className={`sk-opt ${r ? (j === r.correct_option ? "right" : answers[i] === j ? "wrong" : "") : ""}`}
              onClick={() => setAnswers((a) => a.map((x, k) => (k === i ? j : x)))}><b>{String.fromCharCode(65 + j)}</b>{o}</button>)}
            {r?.explanation && <p style={{ margin: 0, fontSize: 13, color: "var(--sk-muted)" }}>{r.explanation}</p>}
          </div>;
        })}
        {result ? <Button onClick={() => { setResult(null); setAnswers(qs.questions.map(() => null)); }}>Try again</Button>
          : <Button variant="primary" loading={busy} disabled={!answered} onClick={submit}>Submit answers</Button>}
      </div>
    </Card>
  );
}

function Practice({ asset, qs }: { asset: Asset; qs: QuestionSet }) {
  return (
    <Card title={asset.title} subtitle="Write your answers in your notebook, then check with your teacher.">
      <ol style={{ paddingLeft: 20, display: "grid", gap: 12, margin: 0 }}>{qs.questions.map((q, i) => <li key={i} style={{ lineHeight: 1.6 }}>{q.question}</li>)}</ol>
    </Card>
  );
}

export default function StudyChapter() {
  const { bookId, chapterId } = useParams<{ bookId: string; chapterId: string }>();
  const { setError, flash } = useFlash();
  const [data, setData] = useState<Data | null>(null);
  const [tab, setTab] = useState("video");
  const load = () => api<Data>(`/student/chapters/${chapterId}`).then(setData).catch((e) => setError(e.message));
  useEffect(() => { void load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [chapterId]);

  const kinds = useMemo(() => ORDER.filter((k) => data?.assets.some((a) => a.kind === k)), [data]);
  useEffect(() => { if (kinds.length && !kinds.includes(tab)) setTab(kinds[0]); }, [kinds, tab]);

  return (
    <Page narrow>
      <PageHeader back={{ href: `/study/${bookId}`, label: "Chapters" }} title={data ? `Chapter ${data.chapter.number}: ${data.chapter.title}` : "Chapter"} />
      {flash}
      {!data ? <Loading /> : kinds.length === 0 ? <Card><Empty title="No study material yet" text="Your teacher hasn’t published notes or quizzes for this chapter yet." /></Card> : <>
        <Tabs value={tab} onChange={setTab} tabs={kinds.map((k) => ({ id: k, label: KIND_LABEL[k] }))} />
        {data.assets.filter((a) => a.kind === tab).map((a) => {
          if (a.kind === "video") { const board = parseStoryboard(a.body); return <Card key={a.id} title={a.title}>{board ? <StoryboardPlayer storyboard={board} /> : <p>This lesson cannot be played.</p>}</Card>; }
          const qs = a.kind === "notes" ? null : parseQuestionSet(a.body);
          if (a.kind === "notes") return <Card key={a.id} title={a.title}><Markdown text={a.body} /></Card>;
          if (!qs) return <Card key={a.id} title={a.title}><p style={{ whiteSpace: "pre-wrap" }}>{a.body}</p></Card>;
          const gradable = a.kind === "quiz" && qs.questions.some((q) => q.options.length > 0);
          return gradable ? <Quiz key={a.id} asset={a} qs={qs} onDone={load} /> : <Practice key={a.id} asset={a} qs={qs} />;
        })}
        <div><Badge tone="info">Content is reviewed by your teacher before it is published.</Badge></div>
      </>}
    </Page>
  );
}
