import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Trash2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { DEFAULT_CATEGORIES, useCategories, useMedicines, useShelves } from "@/lib/queries";
import { shelfCode } from "@/lib/medicine";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/app/shelves")({
  head: () => ({ meta: [{ title: "الرفوف والأصناف — Medicine" }] }),
  component: ShelvesPage,
});

function ShelvesPage() {
  const qc = useQueryClient();
  const { data: shelves = [] } = useShelves();
  const { data: categories = [] } = useCategories();
  const { data: meds = [] } = useMedicines();
  const [count, setCount] = useState("10");
  const [catName, setCatName] = useState("");

  const countBy = (id: string) => meds.filter((m) => m.shelf_id === id).length;

  async function addShelves() {
    const n = Math.min(Math.max(Number(count) || 0, 1), 200);
    const existing = new Set(shelves.map((s) => s.code));
    const rows: { code: string }[] = [];
    for (let i = 0; rows.length < n; i++) {
      const c = shelfCode(i);
      if (!existing.has(c)) rows.push({ code: c });
    }
    const { error } = await supabase.from("shelves").insert(rows);
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ["shelves"] });
    toast.success(`تمت إضافة ${n} رف`);
  }

  async function updateShelf(id: string, patch: { code?: string; name?: string }) {
    await supabase.from("shelves").update(patch).eq("id", id);
    qc.invalidateQueries({ queryKey: ["shelves"] });
  }

  async function removeShelf(id: string) {
    if (!confirm("حذف الرف؟ الأدوية تبقى بدون رف.")) return;
    await supabase.from("shelves").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["shelves"] });
    qc.invalidateQueries({ queryKey: ["medicines"] });
  }

  async function addCategory(name: string) {
    if (!name.trim()) return;
    await supabase.from("categories").insert({ name: name.trim() });
    setCatName("");
    qc.invalidateQueries({ queryKey: ["categories"] });
  }

  async function addDefaults() {
    const have = new Set(categories.map((c) => c.name));
    const rows = DEFAULT_CATEGORIES.filter((n) => !have.has(n)).map((name) => ({ name }));
    if (rows.length) await supabase.from("categories").insert(rows);
    qc.invalidateQueries({ queryKey: ["categories"] });
  }

  async function removeCategory(id: string) {
    await supabase.from("categories").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["categories"] });
  }

  return (
    <div className="space-y-10">
      <section>
        <h1 className="text-display text-3xl">الرفوف</h1>
        <p className="mt-1 text-sm text-muted-foreground">تُرقّم تلقائياً بالأحرف A، B، C… وتقدر تغيّر الرمز أو تعطي كل رف اسم.</p>
        <div className="mt-5 flex items-center gap-2 rounded-2xl bg-card p-3 shadow-soft">
          <span className="ps-2 text-sm text-muted-foreground">إضافة</span>
          <Input type="number" min={1} max={200} value={count} onChange={(e) => setCount(e.target.value)} className="h-10 w-24 rounded-xl" />
          <span className="text-sm text-muted-foreground">رف</span>
          <Button onClick={addShelves} className="ms-auto h-10 rounded-xl">إنشاء</Button>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {shelves.map((s) => (
            <div key={s.id} className="group rounded-3xl bg-card p-4 shadow-soft">
              <div className="flex items-start justify-between">
                <input
                  defaultValue={s.code}
                  onBlur={(e) => e.target.value.trim() && e.target.value !== s.code && updateShelf(s.id, { code: e.target.value.trim() })}
                  className="w-20 bg-transparent text-3xl font-bold text-primary outline-none"
                  dir="ltr"
                />
                <button onClick={() => removeShelf(s.id)} aria-label="حذف" className="text-muted-foreground opacity-60 hover:text-destructive group-hover:opacity-100">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <input
                defaultValue={s.name}
                placeholder="سمّ الرف..."
                onBlur={(e) => e.target.value !== s.name && updateShelf(s.id, { name: e.target.value })}
                className="mt-2 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
              />
              <p className="mt-2 text-xs text-muted-foreground">{countBy(s.id)} علاج</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-display text-2xl">الأصناف</h2>
        <p className="mt-1 text-sm text-muted-foreground">حبوب، شراب، إبر… لتسهيل البحث.</p>
        <form
          onSubmit={(e) => { e.preventDefault(); addCategory(catName); }}
          className="mt-4 flex gap-2"
        >
          <Input value={catName} onChange={(e) => setCatName(e.target.value)} placeholder="صنف جديد" className="h-11 rounded-xl bg-card" />
          <Button type="submit" className="h-11 rounded-xl">إضافة</Button>
        </form>
        <div className="mt-4 flex flex-wrap gap-2">
          {categories.map((c) => (
            <span key={c.id} className="flex items-center gap-1.5 rounded-full bg-card py-1.5 pe-2 ps-4 text-sm shadow-soft">
              {c.name}
              <button onClick={() => removeCategory(c.id)} aria-label="حذف" className="rounded-full p-0.5 text-muted-foreground hover:text-destructive">
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          ))}
          {categories.length === 0 && (
            <Button variant="outline" onClick={addDefaults} className="rounded-full">إضافة الأصناف الشائعة</Button>
          )}
        </div>
      </section>
    </div>
  );
}
