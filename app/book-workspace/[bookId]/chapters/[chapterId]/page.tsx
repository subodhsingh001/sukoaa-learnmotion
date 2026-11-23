"use client";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/learning-api";
import { useAuth } from "@/lib/auth-context";
import { Alert, Badge, Loading, Page, PageHeader, Tabs } from "@/components/ui/kit";
import { errMsg, statusTone } from "@/lib/format";
import ChapterInfo from "@/components/book/ChapterInfo";
import Materials from "@/components/book/Materials";
import type { BookMeta, Chapter } from "@/components/book/types";

export default function ChapterPage() {
  const params = useParams<{ bookId: string; chapterId: string }>();
  const bookId = Number(params.bookId), chapterId = Number(params.chapterId);
  const { user } = useAuth();
  const [tab, setTab] = useState<"info" | "materials">("info");
  const [book, setBook] = useState<BookMeta | null>(null);
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const d = await api<{ book: BookMeta; chapters: Chapter[] }>(`/textbooks/${bookId}/chapter-workspace`);
    const c = d.chapters.find((x) => x.id === chapterId);
    if (!c) throw new Error("This chapter was not found.");
    setBook(d.book); setChapter(c);
  }, [bookId, chapterId]);
  useEffect(() => { if (user) load().catch((e) => setError(errMsg(e))); }, [user, load]);

  return (
    <Page>
      <PageHeader back={{ href: `/book-workspace/${bookId}`, label: book?.title ?? "Chapters" }} title={chapter ? `Chapter ${chapter.number}: ${chapter.title}` : "Chapter"}
        subtitle={book ? `${book.board} · Class ${book.grade} · ${book.subject}` : undefined} actions={chapter && <Badge tone={statusTone(chapter.status)}>{chapter.status}</Badge>} />
      {error && <Alert tone="error">{error}</Alert>}
      {!chapter || !user ? (error ? null : <Loading />) : <>
        <Tabs value={tab} onChange={setTab} tabs={[{ id: "info", label: "Chapter information" }, { id: "materials", label: "Learning material" }]} />
        {/* key forces fresh form state when the loaded chapter changes */}
        {tab === "info" ? <ChapterInfo key={`${chapter.id}-${chapter.printed_start}-${chapter.printed_end}-${chapter.title}`} bookId={bookId} chapter={chapter} role={user.role} reload={load} />
          : <Materials bookId={bookId} chapter={chapter} role={user.role} reload={load} />}
      </>}
    </Page>
  );
}
