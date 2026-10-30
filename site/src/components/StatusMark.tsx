import { statusMark } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Status } from "@/types.generated";

const INKED = new Set<Status>(["reported", "withheld"]);

/** `compact` shows the glyph alone; the label moves to a hover title and stays readable to screen readers. */
export function StatusMark({ status, compact = false }: { status: Status; compact?: boolean }) {
  const { glyph, label } = statusMark(status);
  const inked = INKED.has(status);
  return (
    <span
      className={cn("inline-flex items-center gap-1.5 whitespace-nowrap", !inked && "text-muted-foreground")}
      title={compact ? label : undefined}
    >
      <span aria-hidden="true" className={cn("text-xs", inked && "text-status-reported")}>
        {glyph}
      </span>
      <span className={cn(compact && "sr-only")}>{label}</span>
    </span>
  );
}
