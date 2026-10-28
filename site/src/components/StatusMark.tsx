import { statusMark } from "../lib/format";
import type { Status } from "../types.generated";

export function StatusMark({ status }: { status: Status }) {
  const { glyph, label } = statusMark(status);
  return (
    <span className={`status status-${status}`}>
      <span className="glyph" aria-hidden="true">
        {glyph}
      </span>{" "}
      {label}
    </span>
  );
}
