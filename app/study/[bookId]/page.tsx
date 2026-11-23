"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { api } from "@/lib/learning-api";
import { Card, Empty, Loading, Page, PageHeader, useFlash } from "@/components/ui/kit";

type Data = { book: { id: number; title: string; subject: string; grade: number; board: string }; chapters: { id: number; number: number; title: string }[] };

export default function StudyBook() {
  const { bookId } = useParams<{ bookId: string }>();
  const { setError, flash } = useFlash();
  const [data, setData] = useState<Data | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => { api<Data>(`/student/books/${bookId}`).then(setData).catch((e) => { setError(e.message); setFailed(true); }); }, [bookId, setError]);

  return (
    <Page narrow>
      <PageHeader back={{ href: "/study", label: "My books" }} title={data?.book.title ?? "Book"} subtitle={data ? `${data.book.board} · Class ${data.book.grade} · ${data.book.subject}` : undefined} />
      {flash}
      {!data ? (failed ? <Card><Empty title="Book not available" /></Card> : <Loading />) :
        <Card flush>{data.chapters.map((c) => (
          <Link key={c.id} href={`/study/${bookId}/${c.id}`} className="sk-list-item" style={{ textDecoration: "none", color: "inherit" }}>
            <span className="sk-avatar" style={{ borderRadius: 10 }}>{c.number}</span><b style={{ flex: 1, fontSize: 15 }}>{c.title}</b><ChevronRight size={18} color="var(--sk-faint)" />
          </Link>))}</Card>}
    </Page>
  );
}
