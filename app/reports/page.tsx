"use client";
import { useEffect, useState } from "react";
import { BarChart3, ClipboardCheck, Users } from "lucide-react";
import { api } from "@/lib/learning-api";
import { Card, Empty, Loading, Page, PageHeader, ProgressBar, Stat, useFlash } from "@/components/ui/kit";
import { percent } from "@/lib/format";

type Room = { id: number; name: string };
type Report = { classroom_id: number; classroom_name: string; students: { student_id: number; name: string; email: string; completed_lessons: number; attempts: number;
  average_percent: number | null; latest_score: { score: number; total: number; lesson_slug: string } | null }[] };
const pretty = (slug: string) => slug.replace(/-/g, " ").replace(/^./, (c) => c.toUpperCase());

export default function ReportsPage() {
  const { setError, flash } = useFlash();
  const [rooms, setRooms] = useState<Room[] | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [report, setReport] = useState<Report | null>(null);

  useEffect(() => { api<Room[]>("/school/classrooms").then((r) => { setRooms(r); if (r.length) setSelected(r[0].id); }).catch((e) => { setError(e.message); setRooms([]); }); }, [setError]);
  useEffect(() => { if (selected === null) return; setReport(null); api<Report>(`/assessments/classrooms/${selected}/report`).then(setReport).catch((e) => setError(e.message)); }, [selected, setError]);

  const attempted = report?.students.filter((s) => s.average_percent !== null) ?? [];
  const classAvg = attempted.length ? Math.round(attempted.reduce((a, s) => a + (s.average_percent ?? 0), 0) / attempted.length) : null;
  const totalAttempts = report?.students.reduce((a, s) => a + s.attempts, 0) ?? 0;

  return (
    <Page>
      <PageHeader title="Assessment reports" subtitle="Quiz attempts and results for each classroom."
        actions={rooms && rooms.length > 0 && <select className="sk-select" aria-label="Classroom" value={selected ?? ""} onChange={(e) => setSelected(Number(e.target.value))}>{rooms.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}</select>} />
      {flash}
      {rooms === null || (selected !== null && !report) ? <Loading /> : !report ? <Card><Empty title="No classrooms yet" /></Card> : <>
        <div className="sk-grid cols-4">
          <Stat label="Students" value={report.students.length} icon={<Users size={20} />} />
          <Stat label="Class average" value={classAvg === null ? "—" : `${classAvg}%`} icon={<BarChart3 size={20} />} />
          <Stat label="Quiz attempts" value={totalAttempts} icon={<ClipboardCheck size={20} />} />
        </div>
        <Card title={report.classroom_name} flush>
          {report.students.length === 0 ? <Empty title="No enrolled students" /> :
            <div className="sk-table-wrap"><table className="sk-table"><thead><tr><th>Student</th><th>Lessons done</th><th>Attempts</th><th style={{ width: 200 }}>Average</th><th>Latest result</th></tr></thead><tbody>
              {report.students.map((s) => <tr key={s.student_id}>
                <td><b>{s.name}</b><span className="sk-sub">{s.email}</span></td><td>{s.completed_lessons}</td><td>{s.attempts}</td>
                <td>{s.average_percent === null ? <span style={{ color: "var(--sk-faint)" }}>No attempts</span> : <div style={{ display: "flex", gap: 10, alignItems: "center" }}><ProgressBar value={s.average_percent} /><b style={{ fontSize: 13 }}>{s.average_percent}%</b></div>}</td>
                <td>{s.latest_score ? <>{pretty(s.latest_score.lesson_slug)}<span className="sk-sub">{s.latest_score.score}/{s.latest_score.total} ({percent(s.latest_score.score, s.latest_score.total)}%)</span></> : "—"}</td></tr>)}
            </tbody></table></div>}
        </Card>
      </>}
    </Page>
  );
}
