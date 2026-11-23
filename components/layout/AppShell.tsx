"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AuthProvider } from "@/lib/auth-context";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import RoleGuard from "./RoleGuard";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  useEffect(() => {
    try { setCollapsed(localStorage.getItem("sukoaa-sidebar-collapsed") === "true"); } catch {}
  }, []);
  const toggleSidebar = () => {
    const next = !collapsed;
    setCollapsed(next);
    try { localStorage.setItem("sukoaa-sidebar-collapsed", String(next)); } catch {}
  };
  const pathname = usePathname();
  useEffect(() => setMenuOpen(false), [pathname]);

  // The sign-in screen is full-page, without the app chrome.
  if (pathname === "/login") return <AuthProvider>{children}</AuthProvider>;

  return (
    <AuthProvider>
      <div className={`sk-shell${collapsed ? " sk-collapsed" : ""}`}>
        <Sidebar open={menuOpen} close={() => setMenuOpen(false)} collapsed={collapsed} toggleCollapsed={toggleSidebar} />
        <div className="sk-main">
          <Topbar onMenuOpen={() => setMenuOpen(true)} />
          <main className="sk-content"><RoleGuard>{children}</RoleGuard></main>
        </div>
      </div>
    </AuthProvider>
  );
}
