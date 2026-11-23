"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, ClipboardCheck, PlayCircle, Target } from "lucide-react";
import { api } from "@/lib/learning-api";
import { useAuth } from "@/lib/auth-context";
import { Badge, Card, Empty, Loading, LinkButton, Page, PageHeader, Stat, useFlash } from "@/components/ui/kit";
import { percent } from "@/lib/format";

type Lesson = { slug: string; title: string; subject: string };
type Progress = { lesson_slug: string; completed: boolean; score: number | null; total: number | null };
type Attempt = { id: number; lesson_slug: string; score: number; total: number; submitted_at: string };
type Summary = { quiz_attempts: number; average_percent: number | null };

export default function MyLearning() {
  const { user } = useAuth();
  const { setError, flash } = useFlash();
  const [data, setData] = useState<{ lessons: Lesson[]; progress: Progress[]; attempts: Attempt[]; summary: Summary } | null>(null);

  useEffect(() => {
    Promise.all([api<Lesson[]>("/lessons"), api<Progress[]>("/progress"), api<Attempt[]>("/assessments/me/attempts"), api<Summary>("/student/summary")])
      .then(([lessons, progress, attempts, summary]) => setData({ lessons, progress, attempts, summary }))
      .catch((e) => setError(e.message));
  }, [setError]);

  const done = data?.progress.filter((p) => p.completed).length ?? 0;
  return (
    <Page>
      <PageHeader title={`Hello, ${user?.name.split(" ")[0] ?? "learner"}`} subtitle="Pick up where you left off." actions={<LinkButton variant="primary" href="/study">Open my books</LinkButton>} />
      {flash}
      {!data ? <Loading /> : <>
        <div className="sk-grid cols-4">
          <Stat label="Lessons completed" value={`${done} / ${data.lessons.length}`} icon={<CheckCircle2 size={20} />} />
          <Stat label="Quizzes taken" value={data.summary.quiz_attempts + data.attempts.length} icon={<ClipboardCheck size={20} />} />
          <Stat label="Chapter quiz average" value={data.summary.average_percent === null ? "—" : `${data.summary.average_percent}%`} icon={<Target size={20} />} />
        </div>
        <Card title="Interactive lessons" subtitle="Hands-on 2D and 3D lessons">
          <div className="sk-grid cols-3">{data.lessons.map((l) => {
            const p = data.progress.find((x) => x.lesson_slug === l.slug);
            return <div key={l.slug} className="sk-card" style={{ padding: 16, boxShadow: "none" }}>
              <Badge tone="primary">{l.subject}</Badge>
              <h3 style={{ margin: "10px 0 6px", fontSize: 16 }}>{l.title}</h3>
              <div style={{ marginBottom: 12 }}>{p?.completed ? <Badge tone="success">Completed{p.total ? ` · ${p.score}/${p.total}` : ""}</Badge> : <Badge>Not started</Badge>}</div>
              <Link href={`/learn/${l.slug}`} className="sk-btn sm"><PlayCircle size={15} />{p?.completed ? "Review lesson" : "Start lesson"}</Link>
            </div>;
          })}</div>
        </Card>
        <Card title="Recent quiz results" flush>
          {data.attempts.length === 0 ? <Empty title="No quiz attempts yet" text="Finish a lesson and take its quiz to see your results here." /> :
            <div className="sk-table-wrap"><table className="sk-table"><thead><tr><th>Lesson</th><th>Score</th><th>When</th></tr></thead><tbody>
              {data.attempts.slice(0, 10).map((a) => <tr key={a.id}><td style={{ textTransform: "capitalize" }}>{a.lesson_slug.replace(/-/g, " ")}</td>
                <td><Badge tone={percent(a.score, a.total) >= 60 ? "success" : "warn"}>{a.score}/{a.total}</Badge></td><td>{new Date(a.submitted_at).toLocaleString()}</td></tr>)}
            </tbody></table></div>}
        </Card>
      </>}
    </Page>
  );
}
