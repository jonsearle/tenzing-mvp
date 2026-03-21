import Link from "next/link";
import { notFound } from "next/navigation";

import { requireUser } from "@/lib/auth/session";
import { findAccountById } from "@/lib/data/accounts";
import {
  ACTION_LIBRARY,
  getRecommendedAction,
  listAccountDecisions,
} from "@/lib/decisions";
import { formatCurrency, formatDate } from "@/lib/format";
import { getAccountNoteInterpretation } from "@/lib/notes/interpretation";
import { computeStructuredAccountReview } from "@/lib/scoring/account-detail";
import { saveDecisionAction } from "./actions";

type Props = {
  params: Promise<{
    accountId: string;
  }>;
  searchParams?: Promise<{
    decisionStatus?: string;
  }>;
};

function formatCount(value: number | null) {
  if (value === null) {
    return "Unknown";
  }

  return new Intl.NumberFormat("en-GB", {
    maximumFractionDigits: 0,
  }).format(value);
}

function formatScore(value: number | null) {
  if (value === null) {
    return "Unavailable";
  }

  return `${value}/100`;
}

function formatDateTime(value: string | null) {
  if (!value) {
    return "Saved just now";
  }

  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(new Date(value));
}

function getDecisionStatusMessage(status: string | undefined) {
  switch (status) {
    case "saved":
      return {
        tone: "success",
        text: "Decision saved to append-only history.",
      } as const;
    case "missing-action":
      return {
        tone: "danger",
        text: "Select one of the fixed MVP actions before saving.",
      } as const;
    case "unavailable":
      return {
        tone: "danger",
        text: "Decision persistence is unavailable because Supabase is not configured.",
      } as const;
    case "error":
      return {
        tone: "danger",
        text: "Decision could not be saved for this view.",
      } as const;
    default:
      return null;
  }
}

export default async function AccountPage({ params, searchParams }: Props) {
  await requireUser();

  const { accountId } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const account = await findAccountById(accountId);

  if (!account) {
    notFound();
  }

  const interpretationResult = await getAccountNoteInterpretation(account);
  const review = computeStructuredAccountReview(account, interpretationResult);
  const recommendation = getRecommendedAction(review);
  const decisions = await listAccountDecisions(account.account_id);
  const decisionStatus = getDecisionStatusMessage(
    resolvedSearchParams?.decisionStatus,
  );
  const saveAction = saveDecisionAction.bind(null, {
    accountId: account.account_id,
    recommendedAction: recommendation.action,
    recommendedStateLabel: recommendation.stateLabel,
  });
  const fullAccountData = Object.entries(account).filter(
    ([key]) => key !== "coercion_failures",
  );
  const coercionFailures = Object.entries(account.coercion_failures);
  const interpretationSummary =
    interpretationResult.status === "available"
      ? interpretationResult.interpretation.overallSummary
      : interpretationResult.reason;

  return (
    <main className="shell stack">
      <section className="hero stack">
        <div className="row-between">
          <div className="stack">
            <span className="eyebrow">Account detail</span>
            <h1 className="title">{account.account_name ?? account.account_id}</h1>
            <p className="subtitle">
              Structured account review from the CSV-backed source record, with
              bounded AI note interpretation layered in only where the PRD
              allows it.
            </p>
          </div>
          <Link className="buttonSecondary" href="/portfolio">
            Back to portfolio
          </Link>
        </div>
        <div className="grid cards">
          <article className="metric">
            <span className="eyebrow">Account ID</span>
            <strong>{account.account_id}</strong>
            <span className="muted">Canonical route key</span>
          </article>
          <article className="metric">
            <span className="eyebrow">ARR</span>
            <strong>{formatCurrency(account.arr_gbp)}</strong>
            <span className="muted">Shown separately from state severity</span>
          </article>
        </div>
      </section>

      <section className="panel stack">
        <div>
          <h2>Overview</h2>
          <p className="muted">
            Renewal context is shown separately from diagnosis, and each
            structured state includes confidence based on source completeness.
          </p>
        </div>
        <div className="kv">
          <div>
            <dt>Renewal date</dt>
            <dd>{formatDate(review.renewal.renewalDate)}</dd>
          </div>
          <div>
            <dt>Days to renewal</dt>
            <dd>
              {review.renewal.daysToRenewal === null
                ? "Unavailable"
                : formatCount(review.renewal.daysToRenewal)}
            </dd>
          </div>
          <div>
            <dt>Renewal score</dt>
            <dd>{formatScore(review.renewal.renewalScore)}</dd>
          </div>
          <div>
            <dt>Pipeline potential</dt>
            <dd>{formatCurrency(review.pipelinePotential)}</dd>
          </div>
          <div>
            <dt>Expansion confidence</dt>
            <dd>{formatScore(review.expansionConfidenceScore)}</dd>
          </div>
          <div>
            <dt>Confidence band</dt>
            <dd>{review.expansionConfidenceBand ?? "Unavailable"}</dd>
          </div>
        </div>
        <div className="stateGrid">
          {review.states.map((state) => (
            <article className="stateCard" key={state.key}>
              <span className="eyebrow">{state.label}</span>
              <strong>{formatScore(state.score)}</strong>
              {state.status === "available" ? (
                <span className="muted">
                  Confidence {formatScore(state.confidence)}
                </span>
              ) : (
                <span className="muted">{state.reason}</span>
              )}
            </article>
          ))}
        </div>
      </section>

      <section className="panel stack">
        <div>
          <h2>Recommended action</h2>
          <p className="muted">
            Move from diagnosis to a saved action. The 30 day monitoring idea is
            framing only here, not an active workflow.
          </p>
        </div>
        {decisionStatus ? (
          <p className={`status ${decisionStatus.tone}`}>
            {decisionStatus.text}
          </p>
        ) : null}
        <form action={saveAction} className="stack">
          <div className="kv">
            <div>
              <dt>Default recommendation</dt>
              <dd>{recommendation.action ?? "No recommended action - please select"}</dd>
            </div>
            <div>
              <dt>Prompting state</dt>
              <dd>{recommendation.stateLabel ?? "No single highest state"}</dd>
            </div>
          </div>
          <label className="field">
            <span className="eyebrow">Recommended Action</span>
            <select
              className="input"
              defaultValue={recommendation.action ?? ""}
              name="selectedAction"
            >
              <option value="">No recommended action - please select</option>
              {ACTION_LIBRARY.map((action) => (
                <option key={action.id} value={action.label}>
                  {action.label}
                </option>
              ))}
            </select>
          </label>
          <div className="stack compact">
            {ACTION_LIBRARY.map((action) => (
              <article className="metric" key={action.id}>
                <span className="eyebrow">{action.label}</span>
                <p className="muted">{action.description}</p>
              </article>
            ))}
          </div>
          <label className="field">
            <span className="eyebrow">Decision Note</span>
            <textarea
              className="input textarea"
              name="userNote"
              placeholder="Add short context for the saved decision."
              rows={4}
            />
          </label>
          <div className="row">
            <button className="button" type="submit">
              Save decision
            </button>
            <span className="muted">
              Saves the selected action, recommendation context, and optional note.
            </span>
          </div>
        </form>
      </section>

      <section className="panel stack">
        <div>
          <h2>Decision history</h2>
          <p className="muted">
            Saved decisions stay lightweight and append-only on the account page.
          </p>
        </div>
        {decisions.length === 0 ? (
          <p className="muted">No decisions have been saved for this account yet.</p>
        ) : (
          <div className="stack compact">
            {decisions.map((decision, index) => (
              <article
                className="metric stack compact"
                key={`${decision.accountId}-${decision.createdAt ?? index}`}
              >
                <div className="row-between">
                  <strong>{decision.selectedAction}</strong>
                  <span className="pill">{decision.recommendationOutcome}</span>
                </div>
                <p className="muted">Saved {formatDateTime(decision.createdAt)}</p>
                <p className="muted">
                  Default recommendation:{" "}
                  {decision.defaultRecommendedAction ?? "None"}
                  {decision.defaultRecommendedState
                    ? ` (${decision.defaultRecommendedState})`
                    : ""}
                </p>
                <p>{decision.userNote ?? "No decision note added."}</p>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="panel stack">
        <div>
          <h2>Notes and evidence</h2>
          <p className="muted">
            The AI layer is limited to one account summary plus vibe-based
            signals, and the raw note evidence stays visible for verification.
          </p>
        </div>
        <article className="metric">
          <span className="eyebrow">AI account summary</span>
          <p className="muted">{interpretationSummary}</p>
        </article>
        <div className="stack">
          <article className="metric">
            <span className="eyebrow">Recent customer note</span>
            <p>{account.recent_customer_note ?? "Unavailable"}</p>
          </article>
          <article className="metric">
            <span className="eyebrow">Recent sales note</span>
            <p>{account.recent_sales_note ?? "Unavailable"}</p>
          </article>
          <article className="metric">
            <span className="eyebrow">Recent support summary</span>
            <p>{account.recent_support_summary ?? "Unavailable"}</p>
          </article>
        </div>
      </section>

      <section className="panel stack">
        <div>
          <h2>Full account data</h2>
          <p className="muted">
            The normalized source record stays collapsed by default so the page
            remains reviewable at a glance.
          </p>
        </div>
        <details className="accordion">
          <summary>Expand full account data</summary>
          <div className="accordionContent stack">
            <table className="table">
              <thead>
                <tr>
                  <th>Field</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody>
                {fullAccountData.map(([key, value]) => (
                  <tr key={key}>
                    <td>{key}</td>
                    <td>{value === null ? "Unavailable" : String(value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="stack">
              <h3>Coercion fallbacks</h3>
              {coercionFailures.length === 0 ? (
                <p className="muted">No invalid source values were preserved.</p>
              ) : (
                <table className="table">
                  <thead>
                    <tr>
                      <th>Field</th>
                      <th>Original source value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {coercionFailures.map(([key, value]) => (
                      <tr key={key}>
                        <td>{key}</td>
                        <td>{value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </details>
      </section>
    </main>
  );
}
