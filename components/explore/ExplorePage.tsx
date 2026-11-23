
"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import TopicCard from "./TopicCard";
import Link from "next/link";
import { topics } from "@/data/topics";

const categories = [
  "All",
  "Science",
  "Mathematics",
  "Biology",
  "Physics",
];

export default function ExplorePage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  const filteredTopics = useMemo(() => {
    const query = search.trim().toLowerCase();

    return topics.filter((topic) => {
      const matchesCategory =
        category === "All" || topic.subject === category;

      const matchesSearch =
        topic.title.toLowerCase().includes(query) ||
        topic.subject.toLowerCase().includes(query) ||
        topic.description.toLowerCase().includes(query);

      return matchesCategory && matchesSearch;
    });
  }, [search, category]);

  return (
    <section className="mx-auto max-w-7xl p-5 md:p-8">
      <div className="mb-8 rounded-3xl bg-gradient-to-r from-[#8170E8] to-[#A995F5] p-7 text-white">
        <span className="text-xs font-bold uppercase tracking-widest">
          Your learning universe
        </span>

        <h1 className="mt-3 text-3xl font-extrabold md:text-4xl">
          What will you discover today? 🚀
        </h1>

        <p className="mt-3 max-w-xl text-sm text-purple-100">
          Explore amazing topics through animated explanations,
          experiments and interactive learning.
        </p>
      </div>

      <label className="mb-6 flex items-center gap-3 rounded-2xl bg-white px-5 py-4 shadow-sm">
        <Search size={20} className="text-[#8170E8]" />

        <input
          aria-label="Search learning topics"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search any topic..."
          className="w-full bg-transparent text-[#293568] outline-none"
        />
      </label>

      <div className="mb-7 flex flex-wrap gap-2">
        {categories.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setCategory(item)}
            aria-pressed={category === item}
            className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
              category === item
                ? "bg-[#8170E8] text-white"
                : "bg-white text-[#8170E8] hover:bg-purple-50"
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {filteredTopics.map((topic) => (
          <TopicCard key={topic.id} topic={topic} />
        ))}
      </div>

      <Link href="/learn/life-cycles" className="mt-7 block rounded-3xl border border-emerald-200 bg-emerald-50 p-6 hover:bg-emerald-100"><span className="text-3xl">🦋</span><h2 className="mt-2 text-xl font-bold text-emerald-950">Animal Life Cycles · English / हिन्दी</h2><p className="mt-1 text-sm text-emerald-800">Butterfly, frog, chicken, ladybird and sea turtle — animated chapters, narration and quizzes.</p><span className="mt-2 inline-block text-sm font-bold text-indigo-700">Watch animated lessons →</span></Link>
      {filteredTopics.length === 0 && (
        <div className="rounded-2xl bg-white p-10 text-center">
          <h2 className="font-bold text-[#293568]">
            No matching topics found
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Try a different search or category.
          </p>
        </div>
      )}
    </section>
  );
}