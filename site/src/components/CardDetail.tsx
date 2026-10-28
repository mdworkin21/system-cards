import { ArrowLeft, ExternalLink } from "lucide-react";
import type { ReactNode } from "react";
import { Link, useParams } from "react-router";
import { modelNames } from "@/lib/columns";
import { useDataset } from "@/lib/data";
import { factAt, type AnyFact } from "@/lib/facts";
import { pdfPageUrl } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Cite, DomainOutcome } from "@/types.generated";
import { OutcomeMeter } from "./OutcomeMeter";
import { StatusMark } from "./StatusMark";

const LINK = "font-medium text-link underline-offset-4 hover:underline";
const TH =
  "h-9 border-b bg-muted px-3 text-left align-middle text-xs font-medium whitespace-nowrap text-muted-foreground";
const TD = "border-b px-3 py-2.5 align-top group-last/row:border-b-0";

export function CardDetail() {
  const ds = useDataset();
  const id = useParams()["*"];
  const card = ds.cards.find((c) => c.id === id);
  if (!card) {
    return (
      <section className="space-y-2">
        <p className="text-muted-foreground">No card with this id.</p>
        <Link className={LINK} to="/">
          All cards
        </Link>
      </section>
    );
  }
  const url = card.document.url;
  const { assessments } = card.third_party;

  return (
    <section className="space-y-6">
      <Link
        className="inline-flex items-center gap-1.5 text-muted-foreground underline-offset-4 hover:text-foreground"
        to="/"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        All cards
      </Link>
      <div className="rounded-lg border bg-card p-5 shadow-sm">
        <h2 className="text-lg font-semibold tracking-tight">{card.document.title}</h2>
        <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3 lg:grid-cols-5">
          <Meta term="Models">{modelNames(card)}</Meta>
          <Meta term="Published">{card.document.published ?? "—"}</Meta>
          <Meta term="Pages">{card.document.pages ?? "—"}</Meta>
          <Meta term="Document">
            <a className={cn(LINK, "inline-flex items-center gap-1")} href={url} target="_blank" rel="noreferrer">
              PDF
              <ExternalLink className="size-3" aria-hidden="true" />
            </a>
          </Meta>
          <Meta term="Verification">{card.provenance.verification}</Meta>
        </dl>
      </div>

      <Surface>
        <table className="w-full border-separate border-spacing-0">
          <thead>
            <tr>
              <th scope="col" className={TH}>
                Fact
              </th>
              <th scope="col" className={TH}>
                Status
              </th>
              <th scope="col" className={TH}>
                Value
              </th>
              <th scope="col" className={TH}>
                Note
              </th>
              <th scope="col" className={TH}>
                Cite
              </th>
            </tr>
          </thead>
          <tbody>
            {ds.fact_paths.map((path) => {
              const fact = factAt(card, path);
              return fact ? <FactRow key={path} path={path} fact={fact} url={url} ladder={ds.domain_outcomes} /> : null;
            })}
          </tbody>
        </table>
      </Surface>

      <h3 className="text-base font-semibold tracking-tight">Third-party assessments</h3>
      {assessments.length === 0 ? (
        <p className="text-muted-foreground">None listed.</p>
      ) : (
        <Surface>
          <table className="w-full border-separate border-spacing-0">
            <thead>
              <tr>
                <th scope="col" className={TH}>
                  Assessor
                </th>
                <th scope="col" className={TH}>
                  Pre-deployment
                </th>
                <th scope="col" className={TH}>
                  Scope
                </th>
                <th scope="col" className={TH}>
                  Report
                </th>
                <th scope="col" className={TH}>
                  Cite
                </th>
              </tr>
            </thead>
            <tbody>
              {assessments.map((a, i) => (
                <tr key={i} className="group/row">
                  <th scope="row" className={cn(TD, "text-left font-medium whitespace-nowrap")}>
                    {a.org_name ?? a.org}
                  </th>
                  <td className={TD}>{a.pre_deployment === null ? "—" : a.pre_deployment ? "yes" : "no"}</td>
                  <td className={cn(TD, "min-w-56")}>{a.scope ?? "—"}</td>
                  <td className={TD}>
                    {a.report_url ? (
                      <a className={LINK} href={a.report_url} target="_blank" rel="noreferrer">
                        report
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className={cn(TD, "min-w-72")}>
                    <CiteCell cite={a.cite} url={url} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Surface>
      )}
    </section>
  );
}

function Surface({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-lg border border-input bg-card shadow-md">
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}

function Meta({ term, children }: { term: string; children: ReactNode }) {
  return (
    <div className="space-y-1">
      <dt className="text-xs font-medium text-muted-foreground">{term}</dt>
      <dd className="tabular-nums">{children}</dd>
    </div>
  );
}

function FactRow({ path, fact, url, ladder }: { path: string; fact: AnyFact; url: string; ladder: DomainOutcome[] }) {
  const isDomain = "raw_threshold" in fact;
  return (
    <tr className="group/row hover:bg-muted">
      <th scope="row" className={cn(TD, "text-left font-normal")}>
        <code className="font-mono text-xs whitespace-nowrap">{path}</code>
      </th>
      <td className={TD}>
        <StatusMark status={fact.status} />
      </td>
      <td className={cn(TD, "min-w-56")}>
        {isDomain && fact.value !== null ? <OutcomeMeter value={fact.value} ladder={ladder} /> : fact.value}
        {isDomain && fact.raw_threshold && (
          <div className="mt-1 text-xs leading-relaxed text-muted-foreground">{fact.raw_threshold}</div>
        )}
      </td>
      <td className={cn(TD, "min-w-40 text-xs leading-relaxed text-muted-foreground")}>{fact.note}</td>
      <td className={cn(TD, "min-w-72")}>{fact.cite && <CiteCell cite={fact.cite} url={url} />}</td>
    </tr>
  );
}

function CiteCell({ cite, url }: { cite: Cite; url: string }) {
  return (
    <div className="space-y-1.5">
      <a
        className={cn(LINK, "text-xs tabular-nums")}
        href={pdfPageUrl(url, cite.page)}
        target="_blank"
        rel="noreferrer"
      >
        p. {cite.page}
      </a>
      <blockquote className="border-l-2 border-status-reported pl-3 text-xs leading-relaxed">{cite.quote}</blockquote>
      {cite.note && <p className="text-xs leading-relaxed text-muted-foreground">{cite.note}</p>}
    </div>
  );
}
