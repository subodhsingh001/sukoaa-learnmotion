"use client";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpenCheck, Sparkles, Wand2 } from "lucide-react";
import { api, setToken } from "@/lib/learning-api";
import { useAuth } from "@/lib/auth-context";
import { errMsg, homeFor } from "@/lib/format";
import { Alert, Button, Field } from "@/components/ui/kit";

const DEMO = [
  { label: "Student", email: "student@example.com" },
  { label: "Teacher", email: "teacher@example.com" },
  { label: "Admin", email: "admin@example.com" },
];

export default function LoginPage() {
  const router = useRouter();
  const { user, loading: authLoading, refresh } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (!authLoading && user) router.replace(homeFor(user.role)); }, [authLoading, user, router]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true); setError("");
    try {
      const { access_token } = await api<{ access_token: string }>("/auth/login", { method: "POST", body: JSON.stringify({ email: email.trim(), password }) });
      setToken(access_token);
      const me = await api<{ role: string }>("/me");
      await refresh();
      router.push(homeFor(me.role));
    } catch (err) { setError(errMsg(err)); }
    finally { setBusy(false); }
  }

  return (
    <div className="sk-login">
      <div className="sk-login-art">
        <div className="sk-brand" style={{ padding: 0 }}>
          <div className="sk-brand-mark"><Sparkles size={20} color="#fff" /></div><div><b>SUKOAA</b><small style={{ color: "#d3d8f5" }}>LearnMotion AI</small></div>
        </div>
        <div>
          <h2>From textbook to interactive lesson — in minutes.</h2>
          <p>Upload a school textbook, verify the chapters, and generate notes, quizzes and exercises your teachers review before students ever see them.</p>
        </div>
        <div style={{ display: "flex", gap: 10, color: "#d3d8f5", fontSize: 13 }}><BookOpenCheck size={18} />CBSE &amp; ICSE · Classes 1–12</div>
      </div>
      <div className="sk-login-form">
        <form className="sk-login-box" onSubmit={submit}>
          <div><h1>Welcome back</h1><p style={{ color: "var(--sk-muted)", margin: "6px 0 0" }}>Sign in to continue to your school workspace.</p></div>
          {error && <Alert tone="error">{error}</Alert>}
          <Field label="Email"><input className="sk-input" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus /></Field>
          <Field label="Password"><input className="sk-input" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required /></Field>
          <Button variant="primary" loading={busy} type="submit" style={{ padding: 12 }}>Sign in</Button>
          {process.env.NODE_ENV !== "production" && (
            <div style={{ borderTop: "1px dashed var(--sk-border-strong)", paddingTop: 14 }}>
              <small style={{ color: "var(--sk-muted)", display: "flex", gap: 6, alignItems: "center", marginBottom: 8 }}><Wand2 size={14} />Local demo accounts (run <code>python seed_demo.py</code> first)</small>
              <div className="sk-chips">{DEMO.map((d) => <button type="button" key={d.label} className="sk-chip" onClick={() => { setEmail(d.email); setPassword("DemoOnly123!"); }}>{d.label}</button>)}</div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
