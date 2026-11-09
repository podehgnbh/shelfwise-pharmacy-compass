import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Copy, KeyRound, Trash2 } from "lucide-react";
import { createPharmacy, deletePharmacy, listPharmacies, resetPharmacyPassword } from "@/lib/admin.functions";
import { useMe } from "@/lib/queries";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/app/admin")({
  head: () => ({ meta: [{ title: "الصيدليات — ميديسون" }, { name: "description", content: "إدارة حسابات الصيدليات وبيانات الدخول" }, { property: "og:title", content: "الصيدليات — ميديسون" }, { property: "og:description", content: "إدارة حسابات الصيدليات وبيانات الدخول" }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: AdminPage,
});

function AdminPage() {
  const { data: me } = useMe();
  const qc = useQueryClient();
  const list = useServerFn(listPharmacies);
  const create = useServerFn(createPharmacy);
  const reset = useServerFn(resetPharmacyPassword);
  const del = useServerFn(deletePharmacy);
  const { data: pharmacies = [] } = useQuery({ queryKey: ["pharmacies"], queryFn: () => list(), enabled: !!me?.isAdmin });
  const [f, setF] = useState({ pharmacyName: "", username: "", password: "" });
  const [busy, setBusy] = useState(false);

  if (me && !me.isAdmin) return <p className="text-muted-foreground">هذه الصفحة للمدير فقط.</p>;

  const loginUrl = typeof window !== "undefined" ? `${window.location.origin}/auth` : "/auth";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await create({ data: f });
      const text = `صيدلية: ${f.pharmacyName}\nالرابط: ${loginUrl}\nاسم المستخدم: ${f.username.toLowerCase()}\nكلمة المرور: ${f.password}`;
      await navigator.clipboard?.writeText(text).catch(() => {});
      toast.success("تم إنشاء الحساب ونسخ بيانات الدخول");
      setF({ pharmacyName: "", username: "", password: "" });
      qc.invalidateQueries({ queryKey: ["pharmacies"] });
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function onReset(id: string) {
    const password = prompt("كلمة المرور الجديدة (6 أحرف على الأقل)");
    if (!password) return;
    try {
      await reset({ data: { id, password } });
      toast.success("تم تغيير كلمة المرور");
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  async function onDelete(id: string, name: string) {
    if (!confirm(`حذف صيدلية ${name} وكل بياناتها نهائياً؟`)) return;
    await del({ data: { id } });
    qc.invalidateQueries({ queryKey: ["pharmacies"] });
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-display text-3xl">الصيدليات</h1>
        <p className="mt-1 text-sm text-muted-foreground">أنشئ حساب لكل صيدلية وأرسل لهم الرابط واسم المستخدم وكلمة المرور.</p>
      </div>

      <form onSubmit={submit} className="grid gap-3 rounded-3xl bg-card p-5 shadow-soft sm:grid-cols-4">
        <Input placeholder="اسم الصيدلية" value={f.pharmacyName} onChange={(e) => setF({ ...f, pharmacyName: e.target.value })} className="h-11 rounded-xl" required />
        <Input dir="ltr" placeholder="username" value={f.username} onChange={(e) => setF({ ...f, username: e.target.value })} className="h-11 rounded-xl" required />
        <Input dir="ltr" placeholder="password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} className="h-11 rounded-xl" required />
        <Button type="submit" disabled={busy} className="h-11 rounded-xl">إنشاء حساب</Button>
      </form>

      <div className="flex items-center justify-between rounded-2xl bg-accent px-5 py-3 text-sm text-accent-foreground">
        <span dir="ltr" className="truncate">{loginUrl}</span>
        <button onClick={() => { navigator.clipboard?.writeText(loginUrl); toast.success("تم نسخ الرابط"); }} aria-label="نسخ">
          <Copy className="h-4 w-4" />
        </button>
      </div>

      <div className="overflow-hidden rounded-3xl bg-card shadow-soft">
        {pharmacies.length === 0 ? (
          <p className="p-10 text-center text-muted-foreground">ما في صيدليات بعد</p>
        ) : (
          <ul className="divide-y">
            {pharmacies.map((p) => (
              <li key={p.id} className="flex items-center gap-3 px-5 py-4">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{p.pharmacy_name}</p>
                  <p dir="ltr" className="truncate text-end text-xs text-muted-foreground">@{p.username}</p>
                </div>
                <button onClick={() => onReset(p.id)} aria-label="تغيير كلمة المرور" className="rounded-full p-2 text-muted-foreground hover:bg-secondary">
                  <KeyRound className="h-4 w-4" />
                </button>
                <button onClick={() => onDelete(p.id, p.pharmacy_name)} aria-label="حذف" className="rounded-full p-2 text-muted-foreground hover:bg-secondary hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
