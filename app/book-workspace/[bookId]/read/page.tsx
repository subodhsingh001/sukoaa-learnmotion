"use client";
import { useParams } from "next/navigation";
import UploadBookReader from "@/components/book/UploadBookReader";
export default function ReadBookPage() {
  const { bookId } = useParams<{bookId:string}>();
  const id = Number(bookId);
  return Number.isSafeInteger(id) && id > 0 ? <UploadBookReader bookId={id} /> : <p>Invalid book ID.</p>;
}
