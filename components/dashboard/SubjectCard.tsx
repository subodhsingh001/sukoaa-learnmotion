import Link from "next/link";
import { Clock, ArrowRight } from "lucide-react";
import { subjects } from "@/data/dashboard";
import ProgressRing from "@/components/ui/ProgressRing";

export default function SubjectCard({
  subject,
}: {
  subject: (typeof subjects)[number];
}) {
  return (
    <Link className="subject-card" href={"/explore"}>
      <ProgressRing
        value={subject.progress}
        color={subject.color}
      />

      <div className="subject-info">
        <span className="subject-icon">{subject.icon}</span>
        <strong>{subject.name}</strong>
        <p>{subject.lesson}</p>

        <span className="subject-meta">
          <Clock size={12} /> Continue learning
        </span>
      </div>

      <ArrowRight className="subject-arrow" size={17} />
    </Link>
  );
}
