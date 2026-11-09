import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMedicines, useShelves, type Medicine } from "@/lib/queries";
import { daysUntil, expiryStatus, type ExpiryStatus } from "@/lib/medicine";
import { ExpiryBadge } from "@/components/expiry-badge";
import { MedicineForm } from "@/components/medicine-form";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/app/expiry")({
  head: () => ({ meta: [{ title: "جرد الصلاحية — ميديسون" }, { name: "description", content: "متابعة الأدوية المنتهية والقريبة للانتهاء والكميات" }, { property: "og:title", content: "جرد الصلاحية — ميديسون" }, { property: "og:description", content: "متابعة الأدوية المنتهية والقريبة للانتهاء والكميات" }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: ExpiryPage,
});

function ExpiryPage() {
  const { data: meds = [] } = useMedicines();
  const { data: shelves = [] } = useShelves();
  const [filter, setFilter] = useState<ExpiryStatus | "all">("all");
  const [editing, setEditing] = useState<Medicine | null>(null);
  const shelfMap = useMemo(() => new Map(shelves.map((s) => [s.id, s])), [shelves]);

  const rows = useMemo(
    () =>
      meds
        .map((m) => ({ m, d: daysUntil(m.expiry_date) }))
        .sort((a, b) => (a.d ?? Infinity) - (b.d ?? Infinity)),
    [meds],
  );
  const counts = { expired: 0, soon: 0, ok: 0, none: 0 } as Record<ExpiryStatus, number>;
  rows.forEach((r) => counts[expiryStatus(r.d)]++);
  const visible = filter === "all" ? rows : rows.filter((r) => expiryStatus(r.d) === filter);

  const cards: { key: ExpiryStatus; label: string; cls: string }[] = [
    { key: "expired", label: "منتهية", cls: "text-destructive" },
    { key: "soon", label: "خلال 3 أشهر", cls: "text-warning" },
    { key: "ok", label: "سليمة", cls: "text-success" },
  ];

  return (
    <div>
      <h1 className="text-display text-3xl">جرد الصلاحية</h1>
      <p className="mt-1 text-sm text-muted-foreground">مرتبة من الأقرب للانتهاء.</p>

      <div className="mt-5 grid grid-cols-3 gap-3">
        {cards.map((c) => (
          <button
            key={c.key}
            onClick={() => setFilter(filter === c.key ? "all" : c.key)}
            className={cn(
              "rounded-3xl bg-card p-4 text-start shadow-soft transition-all",
              filter === c.key && "ring-2 ring-primary",
            )}
          >
            <p className={cn("text-3xl font-bold", c.cls)}>{counts[c.key]}</p>
            <p className="mt-1 text-xs text-muted-foreground">{c.label}</p>
          </button>
        ))}
      </div>

      <div className="mt-5 overflow-hidden rounded-3xl bg-card shadow-soft">
        {visible.length === 0 ? (
          <p className="p-10 text-center text-muted-foreground">لا يوجد</p>
        ) : (
          <ul className="divide-y">
            {visible.map(({ m }) => {
              const s = m.shelf_id ? shelfMap.get(m.shelf_id) : undefined;
              return (
                <li key={m.id}>
                  <button onClick={() => setEditing(m)} className="flex w-full items-center gap-4 px-5 py-4 text-start hover:bg-muted/60">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{m.name || m.scientific_name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {[s && `رف ${s.code}`, m.expiry_date, m.quantity != null && `الكمية ${m.quantity}`].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                    <ExpiryBadge date={m.expiry_date} />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      <MedicineForm open={!!editing} onOpenChange={(o) => !o && setEditing(null)} medicine={editing} />
    </div>
  );
}
