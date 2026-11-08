import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { normalizeUsername, usernameToEmail } from "./medicine";

function validateCreds(input: { username: string; password: string }) {
  const username = normalizeUsername(input.username);
  if (username.length < 3) throw new Error("اسم المستخدم لازم 3 أحرف إنجليزية على الأقل");
  if (input.password.length < 6) throw new Error("كلمة المرور لازم 6 أحرف على الأقل");
  return { username, password: input.password };
}

export const hasAdmin = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { count } = await supabaseAdmin
    .from("user_roles")
    .select("id", { count: "exact", head: true })
    .eq("role", "admin");
  return { exists: (count ?? 0) > 0 };
});

/** One-time bootstrap: only works while no admin exists. */
export const setupAdmin = createServerFn({ method: "POST" })
  .inputValidator((i: { username: string; password: string }) => validateCreds(i))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { count } = await supabaseAdmin
      .from("user_roles")
      .select("id", { count: "exact", head: true })
      .eq("role", "admin");
    if ((count ?? 0) > 0) throw new Error("يوجد مدير مسبقاً");
    const { data: u, error } = await supabaseAdmin.auth.admin.createUser({
      email: usernameToEmail(data.username),
      password: data.password,
      email_confirm: true,
    });
    if (error || !u.user) throw new Error(error?.message ?? "فشل الإنشاء");
    await supabaseAdmin.from("profiles").insert({ id: u.user.id, username: data.username, pharmacy_name: "الإدارة" });
    await supabaseAdmin.from("user_roles").insert({ user_id: u.user.id, role: "admin" });
    return { ok: true };
  });

async function assertAdmin(supabase: any, userId: string) {
  const { data } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (!data) throw new Error("غير مصرح");
}

export const listPharmacies = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: roles } = await supabaseAdmin.from("user_roles").select("user_id").eq("role", "pharmacy");
    const ids = (roles ?? []).map((r) => r.user_id);
    if (!ids.length) return [];
    const { data } = await supabaseAdmin
      .from("profiles")
      .select("id, username, pharmacy_name, created_at")
      .in("id", ids)
      .order("created_at", { ascending: false });
    return data ?? [];
  });

export const createPharmacy = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { username: string; password: string; pharmacyName: string }) => ({
    ...validateCreds(i),
    pharmacyName: i.pharmacyName.trim(),
  }))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    if (!data.pharmacyName) throw new Error("اكتب اسم الصيدلية");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: u, error } = await supabaseAdmin.auth.admin.createUser({
      email: usernameToEmail(data.username),
      password: data.password,
      email_confirm: true,
    });
    if (error || !u.user) {
      throw new Error(error?.message?.includes("already") ? "اسم المستخدم مستخدم مسبقاً" : error?.message ?? "فشل الإنشاء");
    }
    await supabaseAdmin.from("profiles").insert({ id: u.user.id, username: data.username, pharmacy_name: data.pharmacyName });
    await supabaseAdmin.from("user_roles").insert({ user_id: u.user.id, role: "pharmacy" });
    return { ok: true };
  });

export const resetPharmacyPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { id: string; password: string }) => {
    if (i.password.length < 6) throw new Error("كلمة المرور لازم 6 أحرف على الأقل");
    return i;
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: isPh } = await supabaseAdmin.rpc("has_role", { _user_id: data.id, _role: "pharmacy" });
    if (!isPh) throw new Error("غير موجود");
    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.id, { password: data.password });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deletePharmacy = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { id: string }) => i)
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: isPh } = await supabaseAdmin.rpc("has_role", { _user_id: data.id, _role: "pharmacy" });
    if (!isPh) throw new Error("غير موجود");
    await supabaseAdmin.from("medicines").delete().eq("owner_id", data.id);
    await supabaseAdmin.from("shelves").delete().eq("owner_id", data.id);
    await supabaseAdmin.from("categories").delete().eq("owner_id", data.id);
    await supabaseAdmin.auth.admin.deleteUser(data.id);
    return { ok: true };
  });
