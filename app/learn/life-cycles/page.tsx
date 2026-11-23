import Link from "next/link";
import BilingualScienceCinema from "@/components/lesson/BilingualScienceCinema";
export const metadata={title:"Animal Life Cycles | SUKOAA LearnMotion AI"};
export default function LifeCyclesPage(){return <main className="mx-auto max-w-6xl px-4 py-8"><Link href="/explore" className="text-sm font-semibold text-indigo-700">← Explore lessons</Link><BilingualScienceCinema topic="life-cycles"/><p className="mt-4 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">These are simplified original animated learning diagrams, not documentary footage. Voice narration uses your browser's installed English and Hindi voices.</p></main>}
