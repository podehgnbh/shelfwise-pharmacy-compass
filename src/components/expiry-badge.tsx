import { daysUntil, describeDays, expiryStatus } from "@/lib/medicine";
import { cn } from "@/lib/utils";

const styles = {
  expired: "bg-danger-soft text-destructive",
  soon: "bg-warning-soft text-warning",
  ok: "bg-success-soft text-success",
  none: "bg-muted text-muted-foreground",
};

export function ExpiryBadge({ date }: { date: string | null }) {
  const d = daysUntil(date);
  return (
    <span className={cn("whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium", styles[expiryStatus(d)])}>
      {describeDays(d)}
    </span>
  );
}
