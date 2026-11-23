import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BookOpen, Play } from "lucide-react";
import { topics } from "@/data/topics";

export function generateStaticParams() { return topics.map(topic => ({ slug: topic.slug })); }

export default async function TopicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const topic = topics.find(item => item.slug === slug);
  if (!topic) notFound();
  return <section className="dashboard-container">
    <Link href="/explore" className="text-link" style={{ marginBottom: 20 }}><ArrowLeft size={16} /> Back to Explore</Link>
    <div className="topic-detail"><div className="topic-detail-icon" style={{ backgroundColor: topic.color }}>{topic.icon}</div>
      <p className="eyebrow">{topic.subject}</p><h1>{topic.title}</h1><p>{topic.description}</p>
      <div className="topic-detail-meta"><BookOpen size={18} /> {topic.lessonCount} lessons planned</div>
      {["solar-system", "atomic-structure", "geometry", "force-and-motion", "human-body", "photosynthesis", "fractions"].includes(topic.slug) ? <Link href={`/learn/${topic.slug}`} className="lesson-primary" style={{ marginTop: 18, width: "fit-content" }}><Play size={16}/> Start interactive lesson</Link> : <p className="topic-detail-note">Interactive lessons for this topic are coming soon.</p>}
    </div>
  </section>;
}
