import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Search, LayoutGrid, CalendarClock, Shield, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useMe } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/app")({
  component: AppShell,
});

function AppShell() {
  const { data: me } = useMe();
  const qc = useQueryClient();
  const navigate = useNavigate();

  const tabs = [
    { to: "/app" as const, label: "البحث", icon: Search, exact: true },
    { to: "/app/shelves" as const, label: "الرفوف", icon: LayoutGrid, exact: false },
    { to: "/app/expiry" as const, label: "الصلاحية", icon: CalendarClock, exact: false },
    ...(me?.isAdmin ? [{ to: "/app/admin" as const, label: "الصيدليات", icon: Shield, exact: false }] : []),
  ];

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen pb-24 md:pb-10">
      <header className="glass sticky top-0 z-30 border-b">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-5">
          <div className="flex items-baseline gap-2">
            <span className="text-display text-lg">Medicine</span>
            {me?.profile?.pharmacy_name && (
              <span className="text-sm text-muted-foreground">· {me.profile.pharmacy_name}</span>
            )}
          </div>
          <nav className="hidden items-center gap-1 md:flex">
            {tabs.map((t) => (
              <Link
                key={t.to}
                to={t.to}
                activeOptions={{ exact: t.exact }}
                className="rounded-full px-4 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground data-[status=active]:bg-secondary data-[status=active]:text-foreground"
              >
                {t.label}
              </Link>
            ))}
          </nav>
          <button onClick={signOut} aria-label="خروج" className="rounded-full p-2 text-muted-foreground hover:bg-secondary">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-5 pt-6">
        <Outlet />
      </main>
      <nav className="glass fixed inset-x-0 bottom-0 z-30 border-t md:hidden">
        <div className="mx-auto flex max-w-md justify-around px-2 pb-[env(safe-area-inset-bottom)]">
          {tabs.map((t) => (
            <Link
              key={t.to}
              to={t.to}
              activeOptions={{ exact: t.exact }}
              className="flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] text-muted-foreground data-[status=active]:text-primary"
            >
              <t.icon className="h-5 w-5" />
              {t.label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
