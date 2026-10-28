import {
  autoUpdate,
  flip,
  FloatingFocusManager,
  FloatingPortal,
  offset,
  safePolygon,
  shift,
  useClick,
  useDismiss,
  useFloating,
  useFocus,
  useHover,
  useInteractions,
  useRole,
} from "@floating-ui/react";
import { ExternalLink } from "lucide-react";
import { useState, type ReactNode } from "react";
import { pdfPageUrl } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Cite } from "@/types.generated";

/** A cell trigger that opens its content on hover, keyboard focus, or a tap. */
export function CitePopover({ trigger, children }: { trigger: ReactNode; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const { refs, floatingStyles, context } = useFloating({
    open,
    onOpenChange: setOpen,
    placement: "bottom-start",
    middleware: [offset(6), flip(), shift({ padding: 8 })],
    whileElementsMounted: autoUpdate,
  });
  const { getReferenceProps, getFloatingProps } = useInteractions([
    useHover(context, { handleClose: safePolygon(), delay: { open: 80 } }),
    useFocus(context),
    // Touch has no hover and no focus-visible; mouse clicks stay with useHover.
    useClick(context, { ignoreMouse: true }),
    useDismiss(context),
    useRole(context, { role: "dialog" }),
  ]);
  return (
    <>
      <button
        type="button"
        className={cn(
          "-mx-1.5 -my-0.5 inline-block cursor-help rounded-md px-1.5 py-0.5 text-left outline-none",
          "hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50 data-[open]:bg-accent",
        )}
        data-open={open || undefined}
        ref={refs.setReference}
        {...getReferenceProps()}
      >
        {trigger}
      </button>
      {open && (
        <FloatingPortal>
          <FloatingFocusManager context={context} modal={false} initialFocus={-1} returnFocus={false}>
            <div
              className="z-50 w-max max-w-[min(26rem,calc(100vw-1rem))] space-y-2 rounded-sm border border-foreground bg-popover p-3 text-sm text-popover-foreground shadow-[0_8px_24px_-8px_rgb(20_21_24/0.25)] [overflow-wrap:anywhere]"
              ref={refs.setFloating}
              style={floatingStyles}
              {...getFloatingProps()}
            >
              {children}
            </div>
          </FloatingFocusManager>
        </FloatingPortal>
      )}
    </>
  );
}

/** The quote, its page, and a link that opens the document at that page. */
export function CiteDetails({ cite, url }: { cite: Cite; url: string }) {
  return (
    <div className="space-y-2">
      <blockquote className="border-l-2 border-status-reported pl-3 font-serif text-[15px] leading-normal">{cite.quote}</blockquote>
      {cite.note && <p className="text-xs leading-relaxed text-muted-foreground">{cite.note}</p>}
      <p>
        <a
          className="inline-flex items-center gap-1 text-xs font-medium text-link underline-offset-4 hover:underline"
          href={pdfPageUrl(url, cite.page)}
          target="_blank"
          rel="noreferrer"
        >
          PDF p. {cite.page}
          <ExternalLink className="size-3" aria-hidden="true" />
        </a>
      </p>
    </div>
  );
}
