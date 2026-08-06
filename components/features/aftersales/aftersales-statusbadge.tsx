import { Badge } from "@/components/ui/badge";

export default function StatusBadge({
  active,
  trueLabel,
  falseLabel,
}: {
  active: boolean;
  trueLabel: string;
  falseLabel: string;
}) {
  return (
    <Badge
      variant="outline"
      className={
        active
          ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300"
          : "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300"
      }
    >
      {active ? trueLabel : falseLabel}
    </Badge>
  );
}
