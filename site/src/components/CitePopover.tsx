import {
  autoUpdate,
  flip,
  FloatingFocusManager,
  FloatingPortal,
  offset,
  safePolygon,
  shift,
  useDismiss,
  useFloating,
  useFocus,
  useHover,
  useInteractions,
  useRole,
} from "@floating-ui/react";
import { useState, type ReactNode } from "react";
import { pdfPageUrl } from "../lib/format";
import type { Cite } from "../types.generated";

/** A cell trigger that opens its content on hover or keyboard focus. */
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
    useDismiss(context),
    useRole(context, { role: "dialog" }),
  ]);
  return (
    <>
      <button type="button" className="cell-trigger" ref={refs.setReference} {...getReferenceProps()}>
        {trigger}
      </button>
      {open && (
        <FloatingPortal>
          <FloatingFocusManager context={context} modal={false} initialFocus={-1} returnFocus={false}>
            <div className="popover" ref={refs.setFloating} style={floatingStyles} {...getFloatingProps()}>
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
    <div className="cite">
      <blockquote>{cite.quote}</blockquote>
      {cite.note && <p className="cite-note">{cite.note}</p>}
      <p className="cite-page">
        <a href={pdfPageUrl(url, cite.page)} target="_blank" rel="noreferrer">
          PDF p. {cite.page}
        </a>
      </p>
    </div>
  );
}
