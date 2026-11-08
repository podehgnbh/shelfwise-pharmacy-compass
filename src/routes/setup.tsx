import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { hasAdmin, setupAdmin } from "@/lib/admin.functions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/setup")({
  head: () => ({
    meta: [
      { title: "إعداد المدير — Medicine" },
      { name: "description", content: "إنشاء حساب المدير الأول لنظام Medicine." },
      { property: "og:title", content: "إعداد المدير — Medicine" },
      { property: "og:description", content: "إنشاء حساب المدير الأول لنظام Medicine." },
    ],
  }),
  component: SetupPage,
});

function SetupPage() {
  const navigate = useNavigate();
  const check = useServerFn(hasAdmin);
  const setup = useServerFn(setupAdmin);
  const [exists, setExists] = useState<boolean | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    check().then((r) => setExists(r.exists));
  }, [check]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await setup({ data: { username, password } });
      toast.success("تم إنشاء حساب المدير، سجّل دخولك الآن");
      navigate({ to: "/auth" });
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-5">
      <div className="w-full max-w-sm text-center">
        <h1 className="text-display text-3xl">إعداد المدير</h1>
        {exists === null ? (
          <p className="mt-6 text-muted-foreground">...</p>
        ) : exists ? (
          <div className="mt-6 rounded-3xl bg-card p-6 shadow-soft">
            <p className="text-muted-foreground">تم إعداد المدير مسبقاً.</p>
            <Link to="/auth" className="mt-4 inline-block text-primary">
              تسجيل الدخول
            </Link>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-8 space-y-3 rounded-3xl bg-card p-6 text-start shadow-soft">
            <p className="text-sm text-muted-foreground">هذا الحساب يتحكم بكل الصيدليات. يُنشأ مرة واحدة فقط.</p>
            <Input dir="ltr" placeholder="username (English)" value={username} onChange={(e) => setUsername(e.target.value)} className="h-12 rounded-xl" required />
            <Input dir="ltr" type="password" placeholder="password" value={password} onChange={(e) => setPassword(e.target.value)} className="h-12 rounded-xl" required />
            <Button type="submit" disabled={loading} className="h-12 w-full rounded-xl">
              إنشاء
            </Button>
          </form>
        )}
      </div>
    </main>
  );
}
