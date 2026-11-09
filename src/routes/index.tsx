import { createFileRoute, redirect } from "@tanstack/react-router";
export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "ميديسون — الدخول إلى الصيدلية" }, { name: "description", content: "إدارة رفوف وأدوية وصلاحيات الصيدلية مع ميديسون" }, { property: "og:title", content: "ميديسون" }, { property: "og:description", content: "الدخول إلى نظام الصيدلية" }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  beforeLoad: () => { throw redirect({ to: "/auth" }); },
});
