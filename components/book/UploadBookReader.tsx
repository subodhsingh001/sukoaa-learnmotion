"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { API, getToken } from "@/lib/learning-api";
import type { PDFDocumentProxy, PDFPageProxy } from "pdfjs-dist";

type Language = "en" | "hi";
type PageProps = { document: PDFDocumentProxy; number: number; scale: number; onText?: (text: string) => void; className?: string };

function PDFSheet({ document, number, scale, onText, className = "" }: PageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    let cancelled = false;
    let renderTask: ReturnType<PDFPageProxy["render"]> | undefined;
    (async () => {
      try {
        const page = await document.getPage(number);
        if (cancelled) return;
        const viewport = page.getViewport({ scale });
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ratio = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.ceil(viewport.width * ratio);
        canvas.height = Math.ceil(viewport.height * ratio);
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;
        const context = canvas.getContext("2d");
        if (!context) return;
        renderTask = page.render({ canvasContext: context, viewport, transform: ratio !== 1 ? [ratio, 0, 0, ratio, 0, 0] : undefined });
        await renderTask.promise;
        if (onText) {
          const content = await page.getTextContent();
          if (!cancelled) onText(content.items.map(item => "str" in item ? item.str : "").join(" "));
        }
      } catch (err) {
        if (!cancelled && !(err instanceof Error && err.name === "RenderingCancelledException")) setError(true);
      }
    })();
    return () => { cancelled = true; renderTask?.cancel(); };
  }, [document, number, scale, onText]);
  return <div className={`relative shrink-0 overflow-hidden bg-white shadow-2xl ${className}`} aria-label={`Page ${number}`}>
    <canvas ref={canvasRef} className="block max-w-none" />
    {error && <div className="absolute inset-0 flex items-center justify-center bg-white p-4 text-red-700">Unable to render page {number}</div>}
    <div className="absolute bottom-1 right-2 rounded bg-white/80 px-2 text-xs text-slate-600">{number}</div>
  </div>;
}

export default function UploadBookReader({ bookId }: { bookId?: number }) {
  const [document, setDocument] = useState<PDFDocumentProxy | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [filename, setFilename] = useState("");
  const [page, setPage] = useState(1);
  const [scale, setScale] = useState(0.95);
  const [language, setLanguage] = useState<Language>("en");
  const [single, setSingle] = useState(false);
  const [thumbnails, setThumbnails] = useState(false);
  const [pageText, setPageText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [bookmarks, setBookmarks] = useState<number[]>([]);
  const [flip, setFlip] = useState<{ direction: "next" | "previous"; from: number; to: number } | null>(null);
  const flipRef = useRef(false);
  const flipTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [speaking, setSpeaking] = useState(false);
  const [speechPaused, setSpeechPaused] = useState(false);
  const speechRun = useRef(0);
  const speechChunks = useRef<string[]>([]);
  const speechIndex = useRef(0);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const viewerRef = useRef<HTMLDivElement>(null);

  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const docRef = useRef<PDFDocumentProxy | null>(null);

  const max = document?.numPages ?? 0;
  const spreadSize = single ? 1 : 2;
  const normalize = useCallback((target: number) => {
    const clamped = Math.min(Math.max(1, target), Math.max(1, max));
    return single ? clamped : Math.floor((clamped - 1) / 2) * 2 + 1;
  }, [max, single]);
  const jump = useCallback((target: number) => { setPage(normalize(target)); }, [normalize]);
  const next = useCallback(() => setPage(p => normalize(p + spreadSize)), [normalize, spreadSize]);
  const previous = useCallback(() => setPage(p => normalize(p - spreadSize)), [normalize, spreadSize]);
  const t = (en: string, hi: string) => language === "en" ? en : hi;

  useEffect(() => { setPage(p => normalize(p)); }, [normalize]);
  useEffect(() => {
    const stored = localStorage.getItem("sukoaa-reader-bookmarks");
    if (stored) { try { setBookmarks(JSON.parse(stored) as number[]); } catch { /* ignore */ } }
    return () => { window.speechSynthesis?.cancel(); };
  }, []);
  const stopReading = useCallback(() => {
    speechRun.current += 1;
    speechChunks.current = [];
    utteranceRef.current = null;
    if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
    setSpeaking(false);
    setSpeechPaused(false);
  }, []);
  useEffect(() => () => {
    if (flipTimer.current) clearTimeout(flipTimer.current);
    speechRun.current += 1;
    window.speechSynthesis?.cancel();
  }, []);
  const open = useCallback(async (file?: File) => {
    if (!file) return;
    setError("");
    if (!file.name.toLowerCase().endsWith(".pdf") && file.type !== "application/pdf") { setError("Please select a PDF file."); return; }
    if (file.size > 100 * 1024 * 1024) { setError("Maximum PDF size is 100 MB."); return; }
    setBusy(true);
    try {
      const pdfjs = await import("pdfjs-dist");
      pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
      const bytes = new Uint8Array(await file.arrayBuffer());
      const loaded = await pdfjs.getDocument({ data: bytes }).promise;
      stopReading();
      const old = docRef.current;
      docRef.current = loaded;
      setDocument(loaded); setFilename(file.name); setPage(1); setPageText("");
      setBookmarks([]);
      if (old) void old.destroy();
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to open PDF."); }
    finally { setBusy(false); }
  }, [stopReading]);
  useEffect(() => {
    if (!bookId) return;
    const controller = new AbortController();
    const load = async () => {
      try {
        setBusy(true);
        const response = await fetch(`${API}/textbooks/${bookId}/pdf`, {
          headers: { Authorization: `Bearer ${getToken() ?? ""}` }, signal: controller.signal, cache: "no-store"
        });
        if (!response.ok) throw new Error(`Unable to open PDF (HTTP ${response.status})`);
        const blob = await response.blob();
        if (!controller.signal.aborted) await open(new File([blob], `book-${bookId}.pdf`, { type: "application/pdf" }));
      } catch (err) {
        if (!controller.signal.aborted) setError(err instanceof Error ? err.message : "Unable to load PDF");
      } finally { if (!controller.signal.aborted) setBusy(false); }
    };
    void load();
    return () => controller.abort();
  }, [bookId, open]);
  useEffect(() => {
    const onFullscreen = () => setFullscreen(window.document.fullscreenElement === viewerRef.current);
    window.document.addEventListener("fullscreenchange", onFullscreen);
    return () => window.document.removeEventListener("fullscreenchange", onFullscreen);
  }, []);
  const changePage = (direction: "next" | "previous") => {
    if (!document) return;
    if (direction === "next" && page + spreadSize > max) return;
    if (direction === "previous" && page <= 1) return;
    if (flipRef.current) return;
    const to = normalize(page + (direction === "next" ? spreadSize : -spreadSize));
    if (to === page) return;
    flipRef.current = true;
    setFlip({ direction, from: page, to });
    flipTimer.current = setTimeout(() => {
      setPage(to);
      setFlip(null);
      flipRef.current = false;
      flipTimer.current = null;
    }, 1150);
  };
  useEffect(() => {
    const handle = (event: KeyboardEvent) => {
      if (!docRef.current || event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
      if (["ArrowRight", "PageDown", "ArrowDown"].includes(event.key)) { event.preventDefault(); next(); }
      if (["ArrowLeft", "PageUp", "ArrowUp"].includes(event.key)) { event.preventDefault(); previous(); }
      if (event.key === "Home") jump(1);
      if (event.key === "End") jump(max);
    };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [next, previous, jump, max]);
  const toggleBookmark = () => {
    const updated = bookmarks.includes(page) ? bookmarks.filter(p => p !== page) : [...bookmarks, page].sort((a, b) => a - b);
    setBookmarks(updated);
    localStorage.setItem("sukoaa-reader-bookmarks", JSON.stringify(updated));
  };
  const speakChunk = (run: number) => {
    if (run !== speechRun.current) return;
    const text = speechChunks.current[speechIndex.current];
    if (!text) { setSpeaking(false); setSpeechPaused(false); return; }
    const utterance = new SpeechSynthesisUtterance(text);
    utteranceRef.current = utterance;
    utterance.lang = language === "hi" ? "hi-IN" : "en-IN";
    utterance.rate = 0.9;
    const matchingVoice = window.speechSynthesis.getVoices().find(v => v.lang.toLowerCase().startsWith(language === "hi" ? "hi" : "en"));
    if (matchingVoice) utterance.voice = matchingVoice;
    utterance.onend = () => {
      if (run !== speechRun.current) return;
      speechIndex.current += 1;
      speakChunk(run);
    };
    utterance.onerror = (event) => {
      if (run !== speechRun.current || event.error === "canceled" || event.error === "interrupted") return;
      setError(`Read aloud failed: ${event.error}. Check your browser speech voices.`);
      setSpeaking(false);
      setSpeechPaused(false);
    };
    window.speechSynthesis.speak(utterance);
  };
  const readAloud = async () => {
    if (!document) return;
    if (!("speechSynthesis" in window)) { setError("Speech is not available in this browser."); return; }
    stopReading();
    const run = speechRun.current;
    setError("");
    try {
      const pageNumbers = [page, ...(!single && page + 1 <= max ? [page + 1] : [])];
      const pieces: string[] = [];
      for (const number of pageNumbers) {
        const pdfPage = await document.getPage(number);
        const content = await pdfPage.getTextContent();
        if (run !== speechRun.current) return;
        pieces.push(content.items.map(item => "str" in item ? item.str : "").join(" "));
      }
      const text = pieces.join(". ").replace(/\s+/g, " ").trim();
      if (!text) { setError("Pages are readable visually, but narration requires selectable text. Scanned PDFs need OCR for read aloud."); return; }
      // Short speech chunks are more reliable across Chrome, Edge and Windows voices.
      const chunks = text.match(/[\s\S]{1,160}/g) ?? [text];
      speechChunks.current = chunks;
      speechIndex.current = 0;
      setSpeaking(true);
      setSpeechPaused(false);
      speakChunk(run);
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to read this page."); setSpeaking(false); }
  };
  useEffect(() => { if (document) stopReading(); }, [page, document, stopReading]);
  const toggleSpeechPause = () => {
    if (!speaking) return;
    if (speechPaused) { window.speechSynthesis.resume(); setSpeechPaused(false); }
    else { window.speechSynthesis.pause(); setSpeechPaused(true); }
  };
  const onText = useCallback((value: string) => setPageText(value), []);
  const buttons = "rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-30";
  return <main className="mx-auto max-w-screen-2xl space-y-4 p-3 md:p-6">
    <Link href={bookId ? `/book-workspace/${bookId}` : "/explore"} className="text-sm font-semibold text-indigo-700">← {bookId ? "Book chapters" : "Explore"}</Link>
    <header className="rounded-2xl bg-gradient-to-r from-slate-900 to-indigo-900 p-5 text-white">
      <p className="text-xs font-bold uppercase tracking-widest text-indigo-200">SUKOAA · Upload & Learn</p>
      <h1 className="mt-1 text-2xl font-extrabold md:text-3xl">{t("Interactive Flipbook Reader", "इंटरैक्टिव फ्लिपबुक रीडर")}</h1>
      <p className="mt-2 text-sm text-indigo-100">{t("Use the arrow keys, swipe, or page buttons to turn pages. Scroll normally to navigate the page.", "दाईं ओर पन्ना पलटने के लिए नीचे और बाईं ओर पलटने के लिए ऊपर स्क्रॉल करें।")}</p>
    </header>
    <div className="flex flex-wrap items-center gap-3 rounded-xl border bg-white p-3">
      <label className="cursor-pointer rounded-lg bg-indigo-700 px-4 py-2 text-sm font-bold text-white">{busy ? "Opening…" : t("Open PDF", "PDF खोलें")}
        <input type="file" accept=".pdf,application/pdf" disabled={busy} className="sr-only" onChange={e => { void open(e.target.files?.[0]); e.currentTarget.value = ""; }}/>
      </label>
      <span className="min-w-0 flex-1 truncate text-sm text-slate-600">{filename || t("Choose a book · stored only in your browser session", "एक पुस्तक चुनें")}</span>
      <button className="rounded-lg border px-3 py-2 text-sm" onClick={() => setLanguage(l => l === "en" ? "hi" : "en")}>{language === "en" ? "हिन्दी" : "English"}</button>
      {document && <button className="rounded-lg border px-3 py-2 text-sm" onClick={() => { stopReading(); setDocument(null); setFilename(""); setPage(1); void docRef.current?.destroy(); docRef.current = null; }}>Close</button>}
    </div>
    {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    <section ref={viewerRef} className="overflow-hidden rounded-2xl bg-slate-950 shadow-xl fullscreen:flex fullscreen:flex-col fullscreen:h-dvh fullscreen:w-screen" aria-label="PDF flipbook">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-700 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <button className={buttons} disabled={!document || page <= 1} onClick={() => changePage("previous")} aria-label="Previous spread">←</button>
          <span className="min-w-24 text-center text-sm text-white">{document ? `${page}${!single && page + 1 <= max ? `–${page + 1}` : ""} / ${max}` : "0 / 0"}</span>
          <button className={buttons} disabled={!document || page + spreadSize > max} onClick={() => changePage("next")} aria-label="Next spread">→</button>
          <label className="text-xs text-slate-300">Page <input aria-label="Go to page" type="number" min={1} max={max || 1} disabled={!document} className="ml-1 w-16 rounded bg-white p-2 text-slate-900" onKeyDown={e => { if (e.key === "Enter") { jump(Number(e.currentTarget.value)); e.currentTarget.blur(); } }} defaultValue={1} key={`${filename}-${page}`} /></label>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button className={buttons} disabled={!document} onClick={() => setSingle(s => !s)}>{single ? "Two pages" : "One page"}</button>
          <button className={buttons} disabled={!document} onClick={() => setThumbnails(v => !v)}>{thumbnails ? "Hide thumbnails" : "Thumbnails"}</button>
          <button className={buttons} disabled={!document} onClick={() => setScale(s => Math.max(0.45, +(s - 0.1).toFixed(2)))}>−</button>
          <span className="text-xs text-white">{Math.round(scale * 100)}%</span>
          <button className={buttons} disabled={!document} onClick={() => setScale(s => Math.min(1.7, +(s + 0.1).toFixed(2)))}>+</button>
          <button className={buttons} disabled={!document} onClick={() => fullscreen ? void window.document.exitFullscreen?.() : void viewerRef.current?.requestFullscreen?.()}>{fullscreen ? "Exit fullscreen" : "⛶ Fullscreen"}</button>
        </div>
      </div>
      <div className="flex min-h-[60vh] fullscreen:min-h-0 fullscreen:flex-1 bg-gradient-to-br from-slate-700 via-slate-800 to-slate-950">
        {document && thumbnails && <aside className="max-h-[75vh] w-32 shrink-0 space-y-3 overflow-y-auto border-r border-slate-600 bg-slate-900 p-3" aria-label="Page thumbnails">
          {Array.from({ length: max }, (_, i) => i + 1).map(n => <button key={n} onClick={() => jump(n)} className={`block w-full rounded p-1 ${n === page || (!single && n === page + 1) ? "bg-indigo-500" : "bg-slate-700"}`}><PDFSheet document={document} number={n} scale={0.12} /><span className="text-xs text-white">{n}</span></button>)}
        </aside>}
        <div onTouchStart={e => { touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; }} onTouchEnd={e => { if (!touchStart.current) return; const dx = e.changedTouches[0].clientX - touchStart.current.x; if (Math.abs(dx) > 65) changePage(dx < 0 ? "next" : "previous"); touchStart.current = null; }} tabIndex={0} className="relative flex min-h-[65vh] flex-1 items-center justify-center overflow-auto p-4 outline-none md:p-8" aria-label="Swipe or use arrow buttons to turn pages">
          {document ? <div className="relative flex w-max items-stretch justify-center" style={{ perspective: "2000px", isolation: "isolate" }}>
            <PDFSheet document={document} number={flip ? flip.to : page} scale={scale} className="border-r border-slate-200" />
            {!single && (flip ? flip.to : page) + 1 <= max && <PDFSheet document={document} number={(flip ? flip.to : page) + 1} scale={scale} />}
            {flip && <div key={`${flip.direction}-${flip.from}-${flip.to}`} className={`pointer-events-none absolute inset-y-0 ${single ? "left-0 w-full" : flip.direction === "next" ? "right-0 w-1/2" : "left-0 w-1/2"} sukoaa-flip-leaf ${flip.direction === "next" ? "sukoaa-flip-forward" : "sukoaa-flip-back"}`} style={{ transformStyle: "preserve-3d", zIndex: 20 }}>
              <div className="absolute inset-0 overflow-hidden bg-white" style={{ backfaceVisibility: "hidden" }}>
                <PDFSheet document={document} number={flip.direction === "next" ? (single ? flip.from : Math.min(flip.from + 1, max)) : flip.to} scale={scale} />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-l from-black/20 via-transparent to-white/10" />
              </div>
              <div className="absolute inset-0 overflow-hidden bg-white" style={{ transform: "rotateY(180deg)", backfaceVisibility: "hidden" }}>
                <PDFSheet document={document} number={flip.direction === "next" ? flip.to : (single ? flip.from : Math.min(flip.from + 1, max))} scale={scale} />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-white/10" />
              </div>
            </div>}
          </div> : <div className="max-w-md text-center text-white"><div className="text-7xl">📖</div><h2 className="mt-4 text-xl font-bold">{t("Open a PDF to start reading", "पढ़ना शुरू करने के लिए PDF खोलें")}</h2><p className="mt-2 text-sm text-slate-300">{t("Real rendered pages, two-page spreads, mouse-wheel page turns and thumbnails.", "असली पृष्ठ, दो पृष्ठ, माउस स्क्रॉल और थंबनेल।")}</p></div>}
          {document && <><button onClick={() => changePage("previous")} disabled={page <= 1} className="absolute left-1 top-1/2 rounded-full bg-slate-900/70 px-3 py-3 text-white disabled:opacity-20" aria-label="Turn left">❮</button><button onClick={() => changePage("next")} disabled={page + spreadSize > max} className="absolute right-1 top-1/2 rounded-full bg-slate-900/70 px-3 py-3 text-white disabled:opacity-20" aria-label="Turn right">❯</button></>}
        </div>
      </div>
      {document && <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-700 p-3 text-sm text-slate-200">
        <span>← → Keyboard · Swipe on touch · Scroll normally</span>
        <div className="flex gap-2"><button className={buttons} onClick={toggleBookmark}>{bookmarks.includes(page) ? "★ Bookmarked" : "☆ Bookmark"}</button><button className={buttons} onClick={() => void readAloud()} disabled={busy}>▶ {speaking ? "Restart reading" : "Read pages"}</button><button className={buttons} onClick={toggleSpeechPause} disabled={!speaking}>{speechPaused ? "▶ Resume" : "Ⅱ Pause"}</button><button className={buttons} onClick={stopReading} disabled={!speaking}>■ Stop</button></div>
      </div>}
    </section>
    {document && bookmarks.length > 0 && <div className="flex flex-wrap items-center gap-2 rounded-xl border bg-white p-3 text-sm"><b>Bookmarks:</b>{bookmarks.map(n => <button key={n} onClick={() => jump(n)} className="rounded bg-indigo-100 px-3 py-1 text-indigo-800">Page {n}</button>)}</div>}
    <style jsx global>{`
      @keyframes sukoaa-page-forward { 0% { transform: rotateY(0deg); filter: brightness(1); } 48% { filter: brightness(.78); } 100% { transform: rotateY(-180deg); filter: brightness(1); } }
      @keyframes sukoaa-page-back { 0% { transform: rotateY(0deg); filter: brightness(1); } 48% { filter: brightness(.78); } 100% { transform: rotateY(180deg); filter: brightness(1); } }
      .sukoaa-flip-forward { transform-origin: left center; animation: sukoaa-page-forward 1150ms cubic-bezier(.22,.7,.24,1) both; }
      .sukoaa-flip-back { transform-origin: right center; animation: sukoaa-page-back 1150ms cubic-bezier(.22,.7,.24,1) both; }
      @media (prefers-reduced-motion: reduce) { .sukoaa-flip-forward, .sukoaa-flip-back { animation-duration: 120ms; } }
    `}</style>
    <p className="text-xs text-slate-500">PDF pages are rendered locally using PDF.js. No book is uploaded to a server. Hindi voice availability depends on your device. Scanned PDFs require OCR for read-aloud. Pages use a 3D turning-sheet animation, not a physics-based curling-paper simulation.</p>
  </main>;
}
