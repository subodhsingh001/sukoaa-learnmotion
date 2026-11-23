import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function LessonPlayer({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
 return <section className="dashboard-container lesson-page">
   <Link href="/explore/solar-system" className="text-link" style={{ marginBottom: 18 }}><ArrowLeft size={16} /> Back to topic</Link>
   <p className="eyebrow">SUKOAA INTERACTIVE LESSON</p>
   <h1 className="lesson-heading">{title}</h1><p className="lesson-subtitle">{subtitle}</p>
   {children}
 </section>;
}
