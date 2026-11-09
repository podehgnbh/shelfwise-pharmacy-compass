import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { useCategories, useMedicines, useShelves, type Medicine } from "@/lib/queries";
import { matchScore } from "@/lib/medicine";
import { MedicineForm } from "@/components/medicine-form";
import { ExpiryBadge } from "@/components/expiry-badge";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/app/")({
  head: () => ({ meta: [{ title: "البحث — ميديسون" }, { name: "description", content: "ابحث عن العلاج والمادة العلمية والشركة وموقع الرف" }, { property: "og:title", content: "البحث — ميديسون" }, { property: "og:description", content: "ابحث عن العلاج والمادة العلمية والشركة وموقع الرف" }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: SearchPage,
});

function SearchPage() {
  const { data: meds = [], isLoading } = useMedicines();
  const { data: shelves = [] } = useShelves();
  const { data: categories = [] } = useCategories();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Medicine | null>(null);

  const shelfMap = useMemo(() => new Map(shelves.map((s) => [s.id, s])), [shelves]);
  const catMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  const results = useMemo(() => {
    return meds
      .filter((m) => !cat || m.category_id === cat)
      .map((m) => {
        const shelf = m.shelf_id ? shelfMap.get(m.shelf_id) : undefined;
        return { m, s: matchScore(q, [m.name, m.scientific_name, m.company, shelf?.code, shelf?.name]) };
      })
      .filter((r) => r.s > 0)
      .sort((a, b) => b.s - a.s)
      .map((r) => r.m);
  }, [meds, q, cat, shelfMap]);

  return (
    <div>
      <div className="relative">
        <Search className="pointer-events-none absolute start-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="ابحث باسم العلاج، المادة، الشركة..."
          className="h-14 w-full rounded-2xl bg-card ps-12 pe-4 text-base shadow-soft outline-none ring-primary/30 focus:ring-4"
        />
      </div>

      <div className="-mx-5 mt-4 flex gap-2 overflow-x-auto px-5 pb-1">
        <Chip active={!cat} onClick={() => setCat(null)}>الكل</Chip>
        {categories.map((c) => (
          <Chip key={c.id} active={cat === c.id} onClick={() => setCat(c.id)}>{c.name}</Chip>
        ))}
      </div>

      <div className="mt-5 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{results.length} علاج</p>
      </div>

      <div className="mt-3 overflow-hidden rounded-3xl bg-card shadow-soft">
        {isLoading ? (
          <p className="p-8 text-center text-muted-foreground">جارِ التحميل...</p>
        ) : results.length === 0 ? (
          <p className="p-10 text-center text-muted-foreground">
            {meds.length === 0 ? "ما مضاف أي علاج بعد. اضغط + لإضافة أول علاج." : "ما لكينا نتيجة"}
          </p>
        ) : (
          <ul className="divide-y">
            {results.map((m) => {
              const shelf = m.shelf_id ? shelfMap.get(m.shelf_id) : undefined;
              const c = m.category_id ? catMap.get(m.category_id) : undefined;
              return (
                <li key={m.id}>
                  <button
                    onClick={() => { setEditing(m); setOpen(true); }}
                    className="flex w-full items-center gap-4 px-5 py-4 text-start transition-colors hover:bg-muted/60"
                  >
                    <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-2xl bg-accent text-accent-foreground">
                      <span className="text-[9px] leading-none">رف</span>
                      <span className="text-base font-bold leading-tight">{shelf?.code ?? "—"}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{m.name || m.scientific_name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {[m.name && m.scientific_name, m.company, c?.name, shelf?.name].filter(Boolean).join(" · ") || "—"}
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

      <button
        onClick={() => { setEditing(null); setOpen(true); }}
        aria-label="إضافة علاج"
        className="fixed bottom-24 end-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lift transition-transform hover:scale-105 md:bottom-8"
      >
        <Plus className="h-6 w-6" />
      </button>

      <MedicineForm open={open} onOpenChange={setOpen} medicine={editing} />
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-full px-4 py-1.5 text-sm transition-colors",
        active ? "bg-foreground text-background" : "bg-card text-muted-foreground shadow-soft hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}
