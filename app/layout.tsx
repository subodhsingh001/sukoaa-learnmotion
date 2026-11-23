import { Suspense } from "react";
import type { Metadata } from "next";
import "./globals.css";
import "./ui.css";
import AppShell from "@/components/layout/AppShell";

export const metadata: Metadata = {
  title: "SUKOAA LearnMotion AI",
  description:
    "Discover, explore and understand the world through interactive AI-powered learning.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body><Suspense fallback={<div className="sk-loading">Loading SUKOAA…</div>}>
        <AppShell>{children}</AppShell>
      </Suspense></body>
    </html>
  );
}
