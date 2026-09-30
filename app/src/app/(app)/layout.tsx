import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Logo } from "@/components/logo";
import { logout } from "@/app/login/actions";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: "chart" },
  { href: "/lancamentos", label: "Lançamentos", icon: "list" },
  { href: "/poupanca", label: "Poupança", icon: "piggy" },
] as const;

function NavIcon({ name }: { name: string }) {
  if (name === "chart") {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 21h18M6 17V9m6 8V4m6 13v-6" strokeLinecap="round" />
      </svg>
    );
  }
  if (name === "piggy") {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path
          d="M19 9a2 2 0 0 1 2 2v1a1 1 0 0 1-1 1h-1v1a3 3 0 0 1-3 3v1a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1v-1H8v1a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-1.5A5.5 5.5 0 0 1 3 12v-.5a4.5 4.5 0 0 1 4.5-4.5h.5a5 5 0 0 1 4-2c1 0 2 .3 2.8.9L17 5l2 .5-.7 1.8A5 5 0 0 1 19 9Z"
          strokeLinejoin="round"
        />
        <circle cx="15.5" cy="10.5" r="0.75" fill="currentColor" stroke="none" />
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
          <Logo height={60} />
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
