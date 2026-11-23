"use client";
import { useParams } from "next/navigation";
import { useState } from "react";
import UploadBookReader from "@/components/book/UploadBookReader";
export default function ReadBookPage() {
  const { bookId } = useParams<{bookId:string}>();
  const id = Number(bookId);
  const [range] = useState<{start?: number; end?: number}>(() => {
    if (typeof window === "undefined") return {};
    const params = new URLSearchParams(window.location.search);
    const requested = Number(params.get("page"));
    const end = Number(params.get("end"));
    const start = params.has("page") && Number.isSafeInteger(requested) && requested > 0 ? requested : undefined;
    const finish = start && params.has("end") && Number.isSafeInteger(end) && end >= start ? end : undefined;
    return {start, end: finish};
  });
  return Number.isSafeInteger(id) && id > 0 ? <UploadBookReader bookId={id} initialPage={range.start} lastPage={range.end} /> : <p>Invalid book ID.</p>;
}
