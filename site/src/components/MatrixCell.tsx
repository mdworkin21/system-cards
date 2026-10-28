import { Link } from "react-router";
import type { CellKind } from "../lib/columns";
import { modelNames } from "../lib/columns";
import { factAt, groupCount, groupPaths, type AnyFact } from "../lib/facts";
import { cardHref, humanize, pdfPageUrl } from "../lib/format";
import type { CardRecord, Dataset, DomainAssessment } from "../types.generated";
import { CiteDetails, CitePopover } from "./CitePopover";
import { OutcomeMeter } from "./OutcomeMeter";
import { StatusMark } from "./StatusMark";

interface Props {
  card: CardRecord;
  cell: CellKind;
  ds: Dataset;
}

export function MatrixCell({ card, cell, ds }: Props) {
  switch (cell.kind) {
    case "model":
      return <Link to={cardHref(card.id)}>{modelNames(card)}</Link>;
    case "tier":
      return <TierCell card={card} ds={ds} />;
    case "domain":
      return <DomainCell card={card} path={cell.path} ds={ds} />;
    case "thirdParty":
      return <ThirdPartyCell card={card} />;
    case "group":
      return <GroupCell card={card} prefix={cell.prefix} ds={ds} />;
    case "pages":
      return <>{card.document.pages ?? "—"}</>;
    case "published":
      return <>{card.document.published ?? "—"}</>;
  }
}

/** A fact that is not `reported`: its mark, with the cite on hover when it has one. */
function MarkCell({ fact, url }: { fact: AnyFact; url: string }) {
  if (!fact.cite) return <StatusMark status={fact.status} />;
  return (
    <CitePopover trigger={<StatusMark status={fact.status} />}>
      <CiteDetails cite={fact.cite} url={url} />
    </CitePopover>
  );
}

function TierCell({ card, ds }: { card: CardRecord; ds: Dataset }) {
  const tier = card.framework.tier;
  const url = card.document.url;
  if (tier.status !== "reported" || !tier.cite || tier.value === null) return <MarkCell fact={tier} url={url} />;
  const rung = card.normalized_tier;
  return (
    <CitePopover trigger={rung === null ? tier.value : `${tier.value} · ${rung}`}>
      <p className="popover-head">{tier.value}</p>
      {rung !== null && (
        <p className="rung">
          <strong>{rung}</strong>: {ds.rungs[rung]}
        </p>
      )}
      <CiteDetails cite={tier.cite} url={url} />
    </CitePopover>
  );
}

function DomainCell({ card, path, ds }: { card: CardRecord; path: string; ds: Dataset }) {
  const fact = factAt(card, path) as DomainAssessment | undefined;
  if (!fact) return null;
  const url = card.document.url;
  if (fact.status !== "reported" || !fact.cite || fact.value === null) return <MarkCell fact={fact} url={url} />;
  return (
    <CitePopover trigger={<OutcomeMeter value={fact.value} ladder={ds.domain_outcomes} />}>
      {fact.raw_threshold && <p className="popover-head">{fact.raw_threshold}</p>}
      <CiteDetails cite={fact.cite} url={url} />
      {fact.note && <p className="fact-note">{fact.note}</p>}
    </CitePopover>
  );
}

function ThirdPartyCell({ card }: { card: CardRecord }) {
  const { summary, assessments } = card.third_party;
  const url = card.document.url;
  if (summary.status !== "reported" || !summary.cite) return <MarkCell fact={summary} url={url} />;
  const names = assessments.map((a) => a.org_name ?? a.org);
  return (
    <CitePopover
      trigger={
        names.length > 0 ? (
          names.join(", ")
        ) : (
          <>
            <StatusMark status="reported" /> {summary.value}
          </>
        )
      }
    >
      {summary.value && <p className="popover-head">{summary.value}</p>}
      <CiteDetails cite={summary.cite} url={url} />
      {assessments.length > 0 && (
        <ul className="sub-list">
          {assessments.map((a, i) => (
            <li key={i}>
              {a.org_name ?? a.org}:{" "}
              <a href={pdfPageUrl(url, a.cite.page)} target="_blank" rel="noreferrer">
                p. {a.cite.page}
              </a>
            </li>
          ))}
        </ul>
      )}
    </CitePopover>
  );
}

function GroupCell({ card, prefix, ds }: { card: CardRecord; prefix: string; ds: Dataset }) {
  const { reported, total } = groupCount(card, prefix, ds.fact_paths);
  return (
    <CitePopover trigger={`${reported}/${total}`}>
      <ul className="sub-list">
        {groupPaths(prefix, ds.fact_paths).map((p) => {
          const fact = factAt(card, p);
          return (
            <li key={p}>
              {humanize(p.slice(prefix.length + 1))}: {fact && <StatusMark status={fact.status} />}
            </li>
          );
        })}
      </ul>
    </CitePopover>
  );
}
