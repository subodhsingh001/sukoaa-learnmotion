
import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";
import type { Topic } from "@/data/topics";

type TopicCardProps = {
  topic: Topic;
};

export default function TopicCard({ topic }: TopicCardProps) {
  return (
    <article className="rounded-3xl bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
      <div
        className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl text-4xl"
        style={{ backgroundColor: topic.color }}
      >
        {topic.icon}
      </div>

      <span className="text-xs font-bold text-[#8170E8]">
        {topic.subject}
      </span>

      <h3 className="mt-2 text-xl font-extrabold text-[#293568]">
        {topic.title}
      </h3>

      <p className="mt-2 min-h-12 text-sm text-slate-500">
        {topic.description}
      </p>

      <div className="mt-5 flex items-center justify-between gap-2">
        <span className="flex items-center gap-1 text-xs text-slate-500">
          <BookOpen size={15} />
          {topic.lessonCount} lessons planned
        </span>

        <Link
          href={`/explore/${topic.slug}`}
          className="flex items-center gap-1 rounded-xl bg-[#8170E8] px-3 py-2 text-xs font-bold text-white hover:bg-[#6656C9]"
        >
          Explore <ArrowRight size={14} />
        </Link>
      </div>
    </article>
  );
}