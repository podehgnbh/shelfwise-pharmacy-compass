import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useCategories, useShelves, type Medicine } from "@/lib/queries";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

type Props = { open: boolean; onOpenChange: (o: boolean) => void; medicine?: Medicine | null };

const empty = { name: "", scientific_name: "", company: "", shelf_id: "", category_id: "", expiry_date: "", quantity: "", notes: "" };

const selectCls = "h-11 w-full rounded-xl border border-input bg-card px-3 text-sm";

export function MedicineForm({ open, onOpenChange, medicine }: Props) {
  const qc = useQueryClient();
  const { data: shelves = [] } = useShelves();
  const { data: categories = [] } = useCategories();
  const [f, setF] = useState(empty);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setF(
      medicine
        ? {
            name: medicine.name ?? "",
            scientific_name: medicine.scientific_name ?? "",
            company: medicine.company ?? "",
            shelf_id: medicine.shelf_id ?? "",
            category_id: medicine.category_id ?? "",
            expiry_date: medicine.expiry_date ?? "",
            quantity: medicine.quantity?.toString() ?? "",
            notes: medicine.notes ?? "",
          }
        : empty,
    );
  }, [open, medicine]);

  const set = (k: keyof typeof empty) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setF((p) => ({ ...p, [k]: e.target.value }));

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!f.name.trim() && !f.scientific_name.trim()) { toast.error("اكتب اسم العلاج أو المادة العلمية"); return; }
    setSaving(true);
    const row = {
      name: f.name.trim() || null,
      scientific_name: f.scientific_name.trim() || null,
      company: f.company.trim() || null,
      shelf_id: f.shelf_id || null,
      category_id: f.category_id || null,
      expiry_date: f.expiry_date || null,
      quantity: f.quantity ? Number(f.quantity) : null,
      notes: f.notes.trim() || null,
    };
    const { error } = medicine
      ? await supabase.from("medicines").update(row).eq("id", medicine.id)
      : await supabase.from("medicines").insert(row);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(medicine ? "تم التعديل" : "تمت الإضافة");
    qc.invalidateQueries({ queryKey: ["medicines"] });
    onOpenChange(false);
  }

  async function remove() {
    if (!medicine || !confirm("حذف هذا العلاج؟")) return;
    await supabase.from("medicines").delete().eq("id", medicine.id);
    qc.invalidateQueries({ queryKey: ["medicines"] });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl sm:max-w-lg" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-start">{medicine ? "تعديل علاج" : "إضافة علاج"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={save} className="space-y-4">
          <p className="text-xs text-muted-foreground">يكفي اسم العلاج أو المادة العلمية، والباقي اختياري.</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="اسم العلاج">
              <Input value={f.name} onChange={set("name")} className="h-11 rounded-xl" />
            </Field>
            <Field label="المادة العلمية">
              <Input value={f.scientific_name} onChange={set("scientific_name")} className="h-11 rounded-xl" />
            </Field>
            <Field label="الشركة">
              <Input value={f.company} onChange={set("company")} className="h-11 rounded-xl" />
            </Field>
            <Field label="الصنف">
              <select value={f.category_id} onChange={set("category_id")} className={selectCls}>
                <option value="">—</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </Field>
            <Field label="الرف">
              <select value={f.shelf_id} onChange={set("shelf_id")} className={selectCls}>
                <option value="">—</option>
                {shelves.map((s) => (
                  <option key={s.id} value={s.id}>{s.code}{s.name ? ` · ${s.name}` : ""}</option>
                ))}
              </select>
            </Field>
            <Field label="تاريخ انتهاء الصلاحية">
              <Input type="date" value={f.expiry_date} onChange={set("expiry_date")} className="h-11 rounded-xl" />
            </Field>
            <Field label="الكمية">
              <Input type="number" min={0} value={f.quantity} onChange={set("quantity")} className="h-11 rounded-xl" />
            </Field>
            <Field label="ملاحظات">
              <Input value={f.notes} onChange={set("notes")} className="h-11 rounded-xl" />
            </Field>
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={saving} className="h-11 flex-1 rounded-xl">حفظ</Button>
            {medicine && (
              <Button type="button" variant="ghost" onClick={remove} className="h-11 rounded-xl text-destructive">حذف</Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
