"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import { api } from "@/lib/learning-api";
import { Badge, Card, Empty, Loading, Page, PageHeader, useFlash } from "@/components/ui/kit";

type Book = { id: number; title: string; board: string; grade: number; subject: string; chapters: number };

export default function StudyLibrary() {
  const { setError, flash } = useFlash();
  const [books, setBooks] = useState<Book[] | null>(null);
  useEffect(() => { api<Book[]>("/student/library").then(setBooks).catch((e) => { setError(e.message); setBooks([]); }); }, [setError]);

  const bySubject = (books ?? []).reduce<Record<string, Book[]>>((acc, b) => { (acc[b.subject] ??= []).push(b); return acc; }, {});
  return (
    <Page>
      <PageHeader title="My books" subtitle="Chapters your teachers have published for you." />
      {flash}
      {books === null ? <Loading /> : books.length === 0 ? <Card><Empty title="No books published yet" text="When your teacher publishes a chapter, it will appear here." /></Card> :
        Object.entries(bySubject).map(([subject, list]) => (
          <section key={subject}>
            <h2 style={{ fontSize: 15, margin: "0 0 10px", color: "var(--sk-muted)" }}>{subject}</h2>
            <div className="sk-grid cols-3">{list.map((b) => (
              <Link key={b.id} href={`/study/${b.id}`} className="sk-card" style={{ padding: 18, textDecoration: "none", color: "inherit", display: "block" }}>
                <div className="sk-stat-icon" style={{ marginBottom: 12 }}><BookOpen size={20} /></div>
                <b style={{ fontSize: 15.5 }}>{b.title}</b>
                <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}><Badge tone="primary">Class {b.grade}</Badge><Badge>{b.board}</Badge><Badge tone="success">{b.chapters} chapter{b.chapters === 1 ? "" : "s"}</Badge></div>
              </Link>))}</div>
          </section>))}
    </Page>
  );
}
