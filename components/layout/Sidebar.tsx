"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, BookOpen, BookText, BrainCircuit, ClipboardList, GraduationCap, Home, LibraryBig, LogIn, LogOut,
  Map, Shapes, ShieldCheck, Sparkles, Upload, Users, X, PanelLeftClose, PanelLeftOpen, type LucideIcon } from "lucide-react";
import { useAuth, type Role } from "@/lib/auth-context";

type Item = { name: string; href: string; icon: LucideIcon; roles?: Role[] };
type Section = { label: string; items: Item[] };

const SECTIONS: Section[] = [
  { label: "Super Admin Dashboard", items: [
    { name: "Platform Overview", href: "/super-admin", icon: ShieldCheck, roles: ["super_admin"] },
  ]},
  { label: "Learn", items: [
    { name: "My Learning", href: "/my-learning", icon: GraduationCap, roles: ["student"] },
    { name: "My Books", href: "/study", icon: BookText, roles: ["student"] },
    { name: "Interactive Lessons", href: "/explore", icon: Shapes },
  ]},
  { label: "Teaching", items: [
    { name: "Teacher Dashboard", href: "/teacher", icon: ClipboardList, roles: ["teacher", "admin"] },
    { name: "Assessment Reports", href: "/reports", icon: BarChart3, roles: ["teacher", "admin"] },
  ]},
  { label: "Content Studio", items: [
    { name: "Book Library", href: "/book-workspace", icon: LibraryBig, roles: ["teacher", "admin"] },
    { name: "Upload Textbook", href: "/textbooks", icon: Upload, roles: ["teacher", "admin"] },
    { name: "Curriculum", href: "/curriculum", icon: BrainCircuit, roles: ["teacher", "admin"] },
  ]},
  { label: "School", items: [
    { name: "School Admin", href: "/school-admin", icon: ShieldCheck, roles: ["admin"] },
    { name: "Teachers & Permissions", href: "/school-admin/teachers", icon: Users, roles: ["admin"] },
    { name: "Product Roadmap", href: "/roadmap", icon: Map, roles: ["admin"] },
  ]},
];

export default function Sidebar({ open, close, collapsed, toggleCollapsed }: { open: boolean; close: () => void; collapsed: boolean; toggleCollapsed: () => void }) {
  const pathname = usePathname();
  const { user, loading, signOut } = useAuth();
  const visible = (i: Item) => !i.roles || (!!user && i.roles.includes(user.role));
  // Longest matching href wins, so /school-admin/teachers does not also highlight /school-admin.
  const all = SECTIONS.flatMap((s) => s.items).filter(visible);
  const current = all.filter((i) => pathname === i.href || pathname.startsWith(i.href + "/")).sort((a, b) => b.href.length - a.href.length)[0]?.href;

  return (
    <>
      {open && <button className="sk-overlay" aria-label="Close navigation" onClick={close} />}
      <aside className={`sk-sidebar${open ? " open" : ""}${collapsed ? " sk-sidebar-collapsed" : ""}`} >
        <div className="sk-brand">
          <div className="sk-brand-mark"><Sparkles size={20} color="#fff" /></div>
          <div className="sk-brand-title"><b>SUKOAA</b><small>LearnMotion AI</small></div>
          <button type="button" className="sk-desktop-collapse" onClick={toggleCollapsed} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} title={collapsed ? "Expand sidebar" : "Collapse sidebar"}>{collapsed ? <PanelLeftOpen size={19} /> : <PanelLeftClose size={19} />}</button>
          <button className="sk-menu-btn" style={{ marginLeft: "auto", color: "#fff" }} onClick={close} aria-label="Close menu"><X size={20} /></button>
        </div>
        <nav className="sk-nav" aria-label="Main navigation">
          <Link href="/" title="Dashboard" onClick={close} aria-current={pathname === "/" ? "page" : undefined}><Home size={18} /><span className="sk-nav-text">Dashboard</span></Link>
          {SECTIONS.map((section) => {
            const items = section.items.filter(visible);
            if (!items.length) return null;
            return (
              <div key={section.label}>
                <div className="sk-nav-label">{section.label}</div>
                {items.map((item) => (
                  <Link key={item.href} href={item.href} title={item.name} onClick={close} aria-current={item.href === current ? "page" : undefined}>
                    <item.icon size={18} /><span className="sk-nav-text">{item.name}</span>
                  </Link>
                ))}
              </div>
            );
          })}
        </nav>
        <div className="sk-nav-foot">
          {!loading && (user
            ? <button className="sk-nav-link" onClick={async () => { await signOut(); window.location.assign("/login"); }}><LogOut size={18} /><span className="sk-nav-text">Sign out</span></button>
            : <Link href="/login"><LogIn size={18} /><span className="sk-nav-text">Sign in</span></Link>)}
        </div>
      </aside>
    </>
  );
}
