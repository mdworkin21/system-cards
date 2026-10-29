import { statusMark } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Status } from "@/types.generated";

const INKED = new Set<Status>(["reported", "withheld"]);

export function StatusMark({ status }: { status: Status }) {
  const { glyph, label } = statusMark(status);
  const inked = INKED.has(status);
  return (
    <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap", !inked && "text-muted-foreground")}>
      <span aria-hidden="true" className={cn("text-xs", inked && "text-status-reported")}>
        {glyph}
      </span>
      {label}
    </span>
  );
}
