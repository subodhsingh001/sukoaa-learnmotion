"use client";
import {useMemo,useState} from "react";
import Link from "next/link";
import {BookOpen,PlayCircle,Search} from "lucide-react";
import {curriculumChapters,curriculumBoards} from "@/data/curriculum";
export default function CurriculumBrowser(){
 const [board,setBoard]=useState<string>("CBSE/NCERT");
 const [grade,setGrade]=useState(6);
 const [subject,setSubject]=useState("");
 const [search,setSearch]=useState("");
 const all=useMemo(()=>curriculumChapters.filter(c=>c.board===board&&c.classLevel===grade),[board,grade]);
 const subjects=useMemo(()=>[...new Set(all.map(c=>c.subject))].sort(),[all]);
 const selected=subject&&subjects.includes(subject)?subject:subjects[0]||"";
 const chapters=all.filter(c=>c.subject===selected&&c.chapterTitle.toLowerCase().includes(search.toLowerCase()));
 return <section className="mx-auto max-w-7xl p-5 md:p-8">
  <div className="rounded-3xl bg-gradient-to-r from-indigo-600 to-violet-500 p-7 text-white"><p className="text-sm font-semibold uppercase tracking-widest">Milestone 13 · Curriculum Explorer</p><h1 className="mt-2 text-3xl font-extrabold">Learn by class, board and subject</h1><p className="mt-3 max-w-3xl text-sm">Browse a starter curriculum map for Classes 1–12. Interactive lessons are marked clearly; other chapters are planned content, not completed videos or official textbook chapter lists.</p></div>
  <div className="mt-6 grid gap-4 rounded-2xl bg-white p-5 shadow-sm md:grid-cols-3">
   <label className="grid gap-2 text-sm font-semibold">Board<select aria-label="Curriculum board" className="rounded-xl border p-3" value={board} onChange={e=>{setBoard(e.target.value);setSubject("")}}>{curriculumBoards.map(b=><option key={b} value={b}>{b}</option>)}</select></label>
   <label className="grid gap-2 text-sm font-semibold">Class<select aria-label="Class" className="rounded-xl border p-3" value={grade} onChange={e=>{setGrade(Number(e.target.value));setSubject("")}}>{Array.from({length:12},(_,i)=>i+1).map(g=><option key={g} value={g}>Class {g}</option>)}</select></label>
   <label className="grid gap-2 text-sm font-semibold">Search chapters<div className="flex items-center gap-2 rounded-xl border px-3"><Search size={18}/><input aria-label="Search chapters" className="w-full py-3 outline-none" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Chapter title"/></div></label>
  </div>
  <div className="mt-6 flex flex-wrap gap-2" aria-label="Subjects">{subjects.map(s=><button key={s} type="button" onClick={()=>setSubject(s)} aria-pressed={selected===s} className={`rounded-xl px-4 py-2 text-sm font-semibold ${selected===s?"bg-indigo-600 text-white":"bg-white text-indigo-700"}`}>{s}</button>)}</div>
  <div className="mt-6 flex items-center justify-between gap-3"><h2 className="text-xl font-bold text-slate-800">Class {grade} · {selected}</h2><span className="text-sm text-slate-500">{chapters.length} chapters</span></div>
  <div className="mt-4 grid gap-4 md:grid-cols-2">{chapters.map(c=><article key={`${c.subject}-${c.chapterNumber}-${c.chapterTitle}`} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"><p className="text-xs font-bold uppercase tracking-wide text-indigo-500">{c.enrichment?"Enrichment":"Chapter "+c.chapterNumber}</p><h3 className="mt-2 text-lg font-bold text-slate-800">{c.chapterTitle}</h3><div className="mt-4 flex items-center justify-between gap-3"><span className={`rounded-full px-3 py-1 text-xs font-semibold ${c.lessonSlug?"bg-emerald-100 text-emerald-700":"bg-slate-100 text-slate-600"}`}>{c.lessonSlug?"Interactive lesson available":"Animation / video planned"}</span>{c.lessonSlug?<Link className="inline-flex items-center gap-2 text-sm font-bold text-indigo-600" href={`/learn/${c.lessonSlug}`}><PlayCircle size={18}/> Open lesson</Link>:<span className="inline-flex items-center gap-1 text-xs text-slate-400"><BookOpen size={16}/> Coming later</span>}</div></article>)}</div>
  {!chapters.length&&<p className="mt-6 rounded-xl bg-white p-6 text-slate-500">No matching chapters. Try a different subject or search.</p>}
  <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"><strong>Curriculum accuracy:</strong> This is a structured, board-aware starter map, not an officially verified or complete CBSE/NCERT or CISCE syllabus. Textbook-specific chapter names, subject choices and stream electives must be verified by class, academic year and board before publication.</div>
 </section>
}
