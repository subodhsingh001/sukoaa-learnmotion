"use client";
import { useEffect, useState } from "react";
import { BarChart3, GraduationCap, School } from "lucide-react";
import { api } from "@/lib/learning-api";
import { Card, Empty, Loading, LinkButton, Page, PageHeader, ProgressBar, Stat, useFlash } from "@/components/ui/kit";

type Room = { id: number; name: string; teacher_name: string; student_count: number };
type Row = { student: { id: number; full_name: string; email: string }; completed_lessons: number };
const TOTAL_LESSONS = 4; // interactive lessons currently available

export default function TeacherPage() {
  const { setError, flash } = useFlash();
  const [rooms, setRooms] = useState<Room[] | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [rows, setRows] = useState<Row[] | null>(null);

  useEffect(() => { api<Room[]>("/school/classrooms").then((r) => { setRooms(r); if (r.length) setSelected(r[0].id); }).catch((e) => { setError(e.message); setRooms([]); }); }, [setError]);
  useEffect(() => { if (selected === null) return; setRows(null); api<Row[]>(`/school/classrooms/${selected}/progress`).then(setRows).catch((e) => { setError(e.message); setRows([]); }); }, [selected, setError]);

  const room = rooms?.find((r) => r.id === selected);
  const avg = rows && rows.length ? Math.round(rows.reduce((a, r) => a + Math.min(100, (r.completed_lessons / TOTAL_LESSONS) * 100), 0) / rows.length) : 0;

  return (
    <Page>
      <PageHeader title="Teacher dashboard" subtitle="See how the students in your classrooms are progressing."
        actions={<><LinkButton href="/reports"><BarChart3 size={16} />Assessment reports</LinkButton><LinkButton variant="primary" href="/book-workspace">Book library</LinkButton></>} />
      {flash}
      {rooms === null ? <Loading /> : rooms.length === 0 ? <Card><Empty icon={<School size={22} />} title="No classrooms assigned" text="Ask your school admin to assign you to a classroom." /></Card> : <>
        <div className="sk-chips" role="group" aria-label="Choose classroom">
          {rooms.map((r) => <button key={r.id} className="sk-chip" aria-pressed={r.id === selected} onClick={() => setSelected(r.id)}>{r.name} · {r.student_count}</button>)}
        </div>
        <div className="sk-grid cols-4">
          <Stat label="Students" value={room?.student_count} icon={<GraduationCap size={20} />} />
          <Stat label="Average lesson completion" value={`${avg}%`} icon={<BarChart3 size={20} />} hint={`of ${TOTAL_LESSONS} interactive lessons`} />
        </div>
        <Card title={room ? `${room.name} — student progress` : "Student progress"} flush>
          {rows === null ? <Loading /> : rows.length === 0 ? <Empty title="No students enrolled" text="Your school admin can enrol students into this classroom." /> :
            <div className="sk-table-wrap"><table className="sk-table"><thead><tr><th>Student</th><th>Lessons completed</th><th style={{ width: 220 }}>Progress</th></tr></thead><tbody>
              {rows.map((s) => <tr key={s.student.id}>
                <td><b>{s.student.full_name}</b><span className="sk-sub">{s.student.email}</span></td>
                <td>{s.completed_lessons} / {TOTAL_LESSONS}</td>
                <td><ProgressBar value={(s.completed_lessons / TOTAL_LESSONS) * 100} /></td></tr>)}
            </tbody></table></div>}
        </Card>
      </>}
    </Page>
  );
}
