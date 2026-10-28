import { Link, useParams } from "react-router";
import { modelNames } from "../lib/columns";
import { useDataset } from "../lib/data";
import { factAt, type AnyFact } from "../lib/facts";
import { pdfPageUrl } from "../lib/format";
import type { Cite, DomainOutcome } from "../types.generated";
import { OutcomeMeter } from "./OutcomeMeter";
import { StatusMark } from "./StatusMark";

export function CardDetail() {
  const ds = useDataset();
  const id = useParams()["*"];
  const card = ds.cards.find((c) => c.id === id);
  if (!card) {
    return (
      <section className="detail">
        <p className="empty">No card with this id.</p>
        <Link to="/">All cards</Link>
      </section>
    );
  }
  const url = card.document.url;
  const { assessments } = card.third_party;

  return (
    <section className="detail">
      <p>
        <Link to="/">← All cards</Link>
      </p>
      <h2>{card.document.title}</h2>
      <dl className="doc-meta">
        <dt>Models</dt>
        <dd>{modelNames(card)}</dd>
        <dt>Published</dt>
        <dd>{card.document.published ?? "—"}</dd>
        <dt>Pages</dt>
        <dd>{card.document.pages ?? "—"}</dd>
        <dt>Document</dt>
        <dd>
          <a href={url} target="_blank" rel="noreferrer">
            PDF
          </a>
        </dd>
        <dt>Verification</dt>
        <dd>{card.provenance.verification}</dd>
      </dl>

      <div className="matrix-box">
        <table className="facts">
          <thead>
            <tr>
              <th scope="col">Fact</th>
              <th scope="col">Status</th>
              <th scope="col">Value</th>
              <th scope="col">Note</th>
              <th scope="col">Cite</th>
            </tr>
          </thead>
          <tbody>
            {ds.fact_paths.map((path) => {
              const fact = factAt(card, path);
              return fact ? <FactRow key={path} path={path} fact={fact} url={url} ladder={ds.domain_outcomes} /> : null;
            })}
          </tbody>
        </table>
      </div>

      <h3>Third-party assessments</h3>
      {assessments.length === 0 ? (
        <p className="empty">None listed.</p>
      ) : (
        <div className="matrix-box">
          <table className="facts">
            <thead>
              <tr>
                <th scope="col">Assessor</th>
                <th scope="col">Pre-deployment</th>
                <th scope="col">Scope</th>
                <th scope="col">Report</th>
                <th scope="col">Cite</th>
              </tr>
            </thead>
            <tbody>
              {assessments.map((a, i) => (
                <tr key={i}>
                  <th scope="row">{a.org_name ?? a.org}</th>
                  <td>{a.pre_deployment === null ? "—" : a.pre_deployment ? "yes" : "no"}</td>
                  <td>{a.scope ?? "—"}</td>
                  <td>
                    {a.report_url ? (
                      <a href={a.report_url} target="_blank" rel="noreferrer">
                        report
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>
                    <CiteCell cite={a.cite} url={url} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function FactRow({ path, fact, url, ladder }: { path: string; fact: AnyFact; url: string; ladder: DomainOutcome[] }) {
  const isDomain = "raw_threshold" in fact;
  return (
    <tr>
      <th scope="row">
        <code>{path}</code>
      </th>
      <td>
        <StatusMark status={fact.status} />
      </td>
      <td>
        {isDomain && fact.value !== null ? <OutcomeMeter value={fact.value} ladder={ladder} /> : fact.value}
        {isDomain && fact.raw_threshold && <div className="raw-term">{fact.raw_threshold}</div>}
      </td>
      <td>{fact.note}</td>
      <td>{fact.cite && <CiteCell cite={fact.cite} url={url} />}</td>
    </tr>
  );
}

function CiteCell({ cite, url }: { cite: Cite; url: string }) {
  return (
    <div className="cite">
      <a href={pdfPageUrl(url, cite.page)} target="_blank" rel="noreferrer">
        p. {cite.page}
      </a>
      <blockquote>{cite.quote}</blockquote>
      {cite.note && <p className="cite-note">{cite.note}</p>}
    </div>
  );
}
