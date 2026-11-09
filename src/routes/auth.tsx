import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { usernameToEmail } from "@/lib/medicine";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import mark from "@/assets/medicine-mark.jpg";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "تسجيل الدخول — Medicine" },
      { name: "description", content: "ادخل لحساب صيدليتك في نظام Medicine." },
      { property: "og:title", content: "تسجيل الدخول — Medicine" },
      { property: "og:description", content: "ادخل لحساب صيدليتك في نظام Medicine." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => { if (data.user) navigate({ to: "/app", replace: true }); });
  }, [navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: usernameToEmail(username),
      password,
    });
    setLoading(false);
    if (error) { toast.error("اسم المستخدم أو كلمة المرور غير صحيحة"); return; }
    navigate({ to: "/app" });
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-5">
      <div className="w-full max-w-sm">
        <img src={mark} alt="" width={96} height={96} className="mx-auto mb-3 h-24 w-24" />
        <Link to="/" className="text-display block text-center text-3xl">
          Medicine
        </Link>
        <p className="mt-2 text-center text-sm text-muted-foreground">ادخل بحساب صيدليتك</p>
        <form onSubmit={submit} className="mt-8 space-y-3 rounded-3xl bg-card p-6 shadow-soft">
          <Input
            dir="ltr"
            placeholder="اسم المستخدم"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoCapitalize="none"
            className="h-12 rounded-xl text-base"
            required
          />
          <Input
            dir="ltr"
            type="password"
            placeholder="كلمة المرور"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-12 rounded-xl text-base"
            required
          />
          <Button type="submit" disabled={loading} className="h-12 w-full rounded-xl text-base">
            {loading ? "جارِ الدخول..." : "دخول"}
          </Button>
        </form>

      </div>
    </main>
  );
}
