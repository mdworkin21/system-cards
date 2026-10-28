import type { CSSProperties } from "react";
import { humanize, outcomeLevel } from "../lib/format";
import type { DomainOutcome } from "../types.generated";

export function OutcomeMeter({ value, ladder }: { value: DomainOutcome; ladder: DomainOutcome[] }) {
  const level = outcomeLevel(value, ladder);
  return (
    <span className="outcome">
      {level !== null && (
        <span className="meter" aria-hidden="true">
          {ladder.map((step, i) => (
            <span
              key={step}
              className={i < level ? "step filled" : "step"}
              style={{ "--step-color": `var(--color-outcome-${i + 1})` } as CSSProperties}
            />
          ))}
        </span>
      )}
      <span className="outcome-label">{humanize(value)}</span>
    </span>
  );
}
