import { createFileRoute, Link } from "@tanstack/react-router";
import { Search, LayoutGrid, CalendarClock } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Medicine — كل علاج بمكانه" },
      { name: "description", content: "نظام Medicine لتقسيم رفوف الصيدلية، البحث الذكي عن العلاج، وجرد الصلاحيات." },
      { property: "og:title", content: "Medicine — كل علاج بمكانه" },
      { property: "og:description", content: "قسّم رفوف صيدليتك، ابحث بذكاء، وتابع الصلاحيات من أي جهاز." },
    ],
  }),
  component: Index,
});

const features = [
  { icon: LayoutGrid, title: "رفوف مرتبة", text: "قسّم الصيدلية لرفوف A وB وC وسمّها مثل ما تحب." },
  { icon: Search, title: "بحث ذكي", text: "اكتب اسم العلاج أو المادة، ويدلّك على رفّه فوراً." },
  { icon: CalendarClock, title: "جرد الصلاحية", text: "ترتيب كامل حسب تاريخ الانتهاء وتنبيه للقريب منها." },
];

function Index() {
  return (
    <main className="min-h-screen">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
        <span className="text-display text-xl">Medicine</span>
        <Link to="/auth" className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground">
          تسجيل الدخول
        </Link>
      </header>
      <section className="mx-auto max-w-3xl px-6 pb-16 pt-16 text-center md:pt-28">
        <h1 className="text-display text-5xl leading-tight md:text-7xl">
          كل علاج.
          <br />
          <span className="text-primary">بمكانه.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
          نظام بسيط وسريع لتنظيم رفوف الصيدلية والعثور على أي دواء بثواني — من الموبايل أو اللابتوب.
        </p>
        <Link
          to="/auth"
          className="mt-10 inline-flex rounded-full bg-primary px-8 py-3 text-base font-medium text-primary-foreground shadow-lift transition-transform hover:scale-[1.02]"
        >
          ابدأ الآن
        </Link>
      </section>
      <section className="mx-auto grid max-w-5xl gap-4 px-6 pb-24 md:grid-cols-3">
        {features.map((f) => (
          <div key={f.title} className="rounded-3xl bg-card p-7 shadow-soft">
            <f.icon className="h-7 w-7 text-primary" />
            <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.text}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
