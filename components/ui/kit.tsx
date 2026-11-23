"use client";
import Link from "next/link";
import { useCallback, useState } from "react";
import { AlertCircle, CheckCircle2, ChevronLeft, Info, TriangleAlert, X, Inbox } from "lucide-react";
import { barTone, errMsg, type Tone } from "@/lib/format";

type Children = { children?: React.ReactNode };

export function Page({ children, narrow }: Children & { narrow?: boolean }) {
  return <div className={`sk-page${narrow ? " narrow" : ""}`}>{children}</div>;
}

export function PageHeader({ title, subtitle, actions, back }: {
  title: string; subtitle?: React.ReactNode; actions?: React.ReactNode; back?: { href: string; label: string };
}) {
  return (
    <header>
      {back && <Link href={back.href} className="sk-back"><ChevronLeft size={15} />{back.label}</Link>}
      <div className="sk-page-head">
        <div><h1>{title}</h1>{subtitle && <p>{subtitle}</p>}</div>
        {actions && <div className="sk-actions">{actions}</div>}
      </div>
    </header>
  );
}

export function Card({ title, subtitle, actions, children, flush, className = "" }: Children & {
  title?: string; subtitle?: string; actions?: React.ReactNode; flush?: boolean; className?: string;
}) {
  return (
    <section className={`sk-card ${className}`}>
      {(title || actions) && (
        <div className="sk-card-head">
          <div>{title && <h2>{title}</h2>}{subtitle && <p>{subtitle}</p>}</div>
          {actions && <div className="sk-actions">{actions}</div>}
        </div>
      )}
      {flush ? children : <div className="sk-card-body">{children}</div>}
    </section>
  );
}

type BtnProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger" | "ghost"; size?: "sm" | "md"; loading?: boolean;
};
export function Button({ variant = "secondary", size = "md", loading, children, disabled, className = "", ...rest }: BtnProps) {
  return (
    <button {...rest} disabled={disabled || loading}
      className={`sk-btn ${variant === "secondary" ? "" : variant} ${size === "sm" ? "sm" : ""} ${className}`}>
      {loading && <span className="sk-spin" aria-hidden />}{children}
    </button>
  );
}
export function LinkButton({ href, variant = "secondary", size = "md", children }: Children & {
  href: string; variant?: "primary" | "secondary" | "ghost"; size?: "sm" | "md";
}) {
  return <Link href={href} className={`sk-btn ${variant === "secondary" ? "" : variant} ${size === "sm" ? "sm" : ""}`}>{children}</Link>;
}

export function Badge({ tone = "neutral", children }: Children & { tone?: Tone }) {
  return <span className={`sk-badge ${tone === "neutral" ? "" : tone}`}>{children}</span>;
}

const ALERT_ICON = { error: AlertCircle, success: CheckCircle2, info: Info, warn: TriangleAlert };
export function Alert({ tone = "info", children, onClose }: Children & { tone?: "error" | "success" | "info" | "warn"; onClose?: () => void }) {
  const Icon = ALERT_ICON[tone];
  return (
    <div className={`sk-alert ${tone}`} role={tone === "error" ? "alert" : "status"}>
      <Icon size={18} style={{ flex: "none", marginTop: 1 }} /><div>{children}</div>
      {onClose && <button onClick={onClose} aria-label="Dismiss"><X size={16} /></button>}
    </div>
  );
}

export function Stat({ label, value, hint, icon }: { label: string; value: React.ReactNode; hint?: string; icon?: React.ReactNode }) {
  return (
    <div className="sk-card sk-stat">
      {icon && <div className="sk-stat-icon">{icon}</div>}
      <div><small>{label}</small><b>{value ?? "—"}</b>{hint && <em>{hint}</em>}</div>
    </div>
  );
}

export function Empty({ title, text, action, icon }: { title: string; text?: string; action?: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div className="sk-empty">
      <div className="sk-empty-icon">{icon ?? <Inbox size={22} />}</div>
      <b>{title}</b>{text && <p style={{ margin: "0 auto 14px", maxWidth: 420 }}>{text}</p>}{action}
    </div>
  );
}

export function Loading({ label = "Loading…" }: { label?: string }) {
  return <div className="sk-loading"><span className="sk-spin" aria-hidden />{label}</div>;
}

export function Field({ label, hint, wide, children }: Children & { label: string; hint?: string; wide?: boolean }) {
  return <label className={`sk-field${wide ? " wide" : ""}`}>{label}{children}{hint && <span className="sk-hint">{hint}</span>}</label>;
}

export function Switch({ checked, onChange, disabled, label }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean; label: string }) {
  return (
    <span className="sk-switch">
      <input type="checkbox" role="switch" aria-label={label} checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} /><i />
    </span>
  );
}

export function ProgressBar({ value }: { value: number }) {
  const v = Math.max(0, Math.min(100, value));
  return <div className={`sk-bar ${barTone(v)}`} role="progressbar" aria-valuenow={v} aria-valuemin={0} aria-valuemax={100}><i style={{ width: `${v}%` }} /></div>;
}

export function Tabs<T extends string>({ tabs, value, onChange }: { tabs: { id: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="sk-tabs" role="tablist">
      {tabs.map((t) => <button key={t.id} role="tab" aria-selected={value === t.id} className="sk-tab" onClick={() => onChange(t.id)}>{t.label}</button>)}
    </div>
  );
}

export function Pager({ page, pages, onPage }: { page: number; pages: number; onPage: (p: number) => void }) {
  if (pages <= 1) return null;
  return (
    <div className="sk-pager">
      <span>Page {page} of {pages}</span>
      <div className="sk-actions">
        <Button size="sm" disabled={page <= 1} onClick={() => onPage(page - 1)}>Previous</Button>
        <Button size="sm" disabled={page >= pages} onClick={() => onPage(page + 1)}>Next</Button>
      </div>
    </div>
  );
}

/** Flash messages + a busy flag + a safe runner for async actions. */
export function useFlash() {
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const run = useCallback(async (action: () => Promise<unknown>, ok?: string) => {
    setBusy(true); setError(""); setMessage("");
    try { await action(); if (ok) setMessage(ok); return true; }
    catch (e) { setError(errMsg(e)); return false; }
    finally { setBusy(false); }
  }, []);
  const flash = (
    <>
      {error && <Alert tone="error" onClose={() => setError("")}>{error}</Alert>}
      {message && <Alert tone="success" onClose={() => setMessage("")}>{message}</Alert>}
    </>
  );
  return { error, message, busy, setError, setMessage, setBusy, run, flash };
}

/** Minimal, dependency-free Markdown (headings, bullets, **bold**) for AI notes. */
export function Markdown({ text }: { text: string }) {
  const inline = (s: string) => s.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? <strong key={i}>{part.slice(2, -2)}</strong> : part);
  const out: React.ReactNode[] = []; let bullets: string[] = [];
  const flush = () => { if (bullets.length) { out.push(<ul key={`u${out.length}`}>{bullets.map((b, i) => <li key={i}>{inline(b)}</li>)}</ul>); bullets = []; } };
  text.split("\n").forEach((raw, i) => {
    const line = raw.trimEnd();
    if (/^\s*[-*•]\s+/.test(line)) { bullets.push(line.replace(/^\s*[-*•]\s+/, "")); return; }
    flush();
    if (/^#{1,2}\s/.test(line)) out.push(<h2 key={i}>{inline(line.replace(/^#+\s*/, ""))}</h2>);
    else if (/^#{3,}\s/.test(line)) out.push(<h3 key={i}>{inline(line.replace(/^#+\s*/, ""))}</h3>);
    else if (line.trim()) out.push(<p key={i}>{inline(line)}</p>);
  });
  flush();
  return <div className="sk-prose">{out}</div>;
}
