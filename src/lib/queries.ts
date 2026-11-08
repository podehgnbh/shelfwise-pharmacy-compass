import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Medicine = Database["public"]["Tables"]["medicines"]["Row"];
export type Shelf = Database["public"]["Tables"]["shelves"]["Row"];
export type Category = Database["public"]["Tables"]["categories"]["Row"];

export function useMe() {
  return useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return null;
      const [{ data: profile }, { data: roles }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", u.user.id).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", u.user.id),
      ]);
      return {
        id: u.user.id,
        profile,
        isAdmin: (roles ?? []).some((r) => r.role === "admin"),
      };
    },
  });
}

export function useShelves() {
  return useQuery({
    queryKey: ["shelves"],
    queryFn: async () => {
      const { data, error } = await supabase.from("shelves").select("*").order("created_at");
      if (error) throw error;
      return data;
    },
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });
}

export function useMedicines() {
  return useQuery({
    queryKey: ["medicines"],
    queryFn: async () => {
      const all: Medicine[] = [];
      for (let from = 0; ; from += 1000) {
        const { data, error } = await supabase
          .from("medicines")
          .select("*")
          .order("created_at", { ascending: false })
          .range(from, from + 999);
        if (error) throw error;
        all.push(...data);
        if (data.length < 1000) break;
      }
      return all;
    },
  });
}

export const DEFAULT_CATEGORIES = ["حبوب", "شراب", "إبر", "مرهم", "قطرة", "تحاميل", "بخاخ"];
