"use client";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

const TITLES: [string, string][] = [
  ["/school-admin/teachers", "Teachers & Permissions"], ["/school-admin", "School Admin"], ["/teacher", "Teacher Dashboard"],
  ["/reports", "Assessment Reports"], ["/book-workspace", "Book Library"], ["/textbooks", "Upload Textbook"], ["/curriculum", "Curriculum"],
  ["/my-learning", "My Learning"], ["/study", "My Books"], ["/explore", "Interactive Lessons"], ["/learn", "Interactive Lessons"],
  ["/roadmap", "Product Roadmap"],
];

export default function Topbar({ onMenuOpen }: { onMenuOpen: () => void }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const title = pathname === "/" ? "Dashboard" : TITLES.find(([p]) => pathname.startsWith(p))?.[1] ?? "SUKOAA";
  return (
    <header className="sk-topbar">
      <button className="sk-menu-btn" onClick={onMenuOpen} aria-label="Open menu"><Menu size={22} /></button>
      <div className="sk-crumbs">SUKOAA <span aria-hidden>/</span> <b>{title}</b></div>
      <div className="sk-spacer" />
      {user && (
        <div className="sk-user">
          <div className="sk-avatar" aria-hidden>{user.name.charAt(0).toUpperCase()}</div>
          <div className="sk-user-meta"><b>{user.name}</b><small>{user.role}</small></div>
        </div>
      )}
    </header>
  );
}
