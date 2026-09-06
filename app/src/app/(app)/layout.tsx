import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Logo } from "@/components/logo";
import { logout } from "@/app/login/actions";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: "chart" },
  { href: "/lancamentos", label: "Lançamentos", icon: "list" },
] as const;

function NavIcon({ name }: { name: string }) {
  if (name === "chart") {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 21h18M6 17V9m6 8V4m6 13v-6" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" strokeLinecap="round" />
    </svg>
  );
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen flex">
      <aside className="w-60 shrink-0 border-r border-border bg-surface flex flex-col">
        <div className="px-5 py-6">
          <Logo />
        </div>
        <nav className="flex-1 px-3 space-y-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted hover:text-foreground hover:bg-surface-2 transition-colors"
            >
              <NavIcon name={item.icon} />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-border">
          <p className="px-3 text-xs text-muted truncate mb-2">{user?.email}</p>
          <form action={logout}>
            <button className="w-full text-left px-3 py-2 rounded-lg text-sm text-muted hover:text-danger hover:bg-surface-2 transition-colors">
              Sair
            </button>
          </form>
        </div>
      </aside>
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}
