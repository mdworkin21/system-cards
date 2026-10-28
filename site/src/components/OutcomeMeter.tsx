import { humanize, outcomeLevel, outcomeShort } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { DomainOutcome } from "@/types.generated";

// Literal class names so Tailwind generates them; indexed by ladder step.
const STEP_FILL = ["bg-outcome-1", "bg-outcome-2", "bg-outcome-3", "bg-outcome-4", "bg-outcome-5"];

interface Props {
  value: DomainOutcome;
  ladder: DomainOutcome[];
  /** "short" in matrix cells; the full humanized outcome elsewhere. */
  label?: "short" | "full";
}

export function OutcomeMeter({ value, ladder, label = "full" }: Props) {
  const level = outcomeLevel(value, ladder);
  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap">
      {level !== null && (
        <span className="inline-flex gap-0.5" aria-hidden="true">
          {ladder.map((step, i) => (
            <span
              key={step}
              className={cn("h-3 w-1.5 rounded-[1px]", i < level ? (STEP_FILL[i] ?? STEP_FILL.at(-1)) : "bg-border")}
            />
          ))}
        </span>
      )}
      <span>{label === "short" ? outcomeShort(value) : humanize(value)}</span>
    </span>
  );
}
