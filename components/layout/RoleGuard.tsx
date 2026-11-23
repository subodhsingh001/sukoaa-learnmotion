"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Lock } from "lucide-react";
import { useAuth, type Role } from "@/lib/auth-context";
import { Empty, LinkButton, Loading } from "@/components/ui/kit";
import { homeFor } from "@/lib/format";

/** First matching prefix decides who may open the page. Pages not listed are public. */
const RULES: [string, Role[]][] = [
  ["/super-admin", ["super_admin"]],
  ["/school-admin", ["admin"]],
  ["/roadmap", ["admin"]],
  ["/teacher", ["teacher", "admin"]],
  ["/reports", ["teacher", "admin"]],
  ["/book-workspace", ["teacher", "admin"]],
  ["/textbooks", ["teacher", "admin"]],
  ["/my-learning", ["student"]],
  ["/study", ["student"]],
];

export default function RoleGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const rule = RULES.find(([prefix]) => pathname === prefix || pathname.startsWith(prefix + "/"));
  if (!rule) return <>{children}</>;
  if (loading) return <Loading label="Checking your account…" />;
  if (!user) return <Empty icon={<Lock size={22} />} title="Please sign in" text="You need to sign in to open this page." action={<LinkButton variant="primary" href="/login">Sign in</LinkButton>} />;
  if (!rule[1].includes(user.role))
    return <Empty icon={<Lock size={22} />} title="This page isn’t available for your account" text={`Your account type is “${user.role}”.`} action={<Link className="sk-btn primary" href={homeFor(user.role)}>Go to my home</Link>} />;
  return <>{children}</>;
}
