import Link from "next/link";
import { notFound } from "next/navigation";

import { ReviewerHeader } from "@/components/reviewer-header";
import {
  ACTION_LIBRARY,
  getActionExecutionPlan,
  getActionLibraryItem,
  getRecommendedAction,
  listAccountDecisions,
} from "@/lib/decisions";
import { requireUser } from "@/lib/auth/session";
import { findAccountById } from "@/lib/data/accounts";
import { formatCurrency, formatDate, formatScore } from "@/lib/format";
import { getAccountNoteInterpretation } from "@/lib/notes/interpretation";
import { getRankedGrowthAccounts } from "@/lib/scoring/growth-queue";
import { getRankedRiskAccounts } from "@/lib/scoring/risk-queue";
import { computeStructuredAccountReview } from "@/lib/scoring/account-detail";
import {
  getStateDisplayLabelFromCanonicalLabel,
  getStateDisplayValue,
} from "@/lib/scoring/state-display";
import { getCellToneClass } from "@/app/portfolio-v2/view-model";
import { saveDecisionActionV2 } from "./actions";

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
    return "Unavailable";
  }

  return new Intl.NumberFormat("en-GB", {
    maximumFractionDigits: 0,
  }).format(value);
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
        text: "Decision saved.",
      } as const;
    case "missing-action":
      return {
        tone: "danger",
        text: "Select an action before saving.",
      } as const;
    case "unavailable":
      return {
        tone: "danger",
        text: "Decision saving is unavailable right now.",
      } as const;
    case "error":
      return {
        tone: "danger",
        text: "Decision could not be saved.",
      } as const;
    default:
      return null;
  }
}

export default async function AccountV2Page({ params, searchParams }: Props) {
  await requireUser("/accounts-v2");

  const { accountId } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const [account, riskAccounts, growthAccounts] = await Promise.all([
    findAccountById(accountId),
    getRankedRiskAccounts(),
    getRankedGrowthAccounts(),
  ]);

  if (!account) {
    notFound();
  }

  const riskRank =
    riskAccounts.find((rankedAccount) => rankedAccount.accountId === account.account_id)
      ?.rank ?? null;
  const growthRank =
    growthAccounts.find((rankedAccount) => rankedAccount.accountId === account.account_id)
      ?.rank ?? null;

  const interpretationResult = await getAccountNoteInterpretation(account);
  const review = computeStructuredAccountReview(account, interpretationResult);
  const recommendation = getRecommendedAction(review);
  const actionPlan = getActionExecutionPlan(recommendation.action, account, review);
  const decisions = await listAccountDecisions(account.account_id);
  const decisionStatus = getDecisionStatusMessage(
    resolvedSearchParams?.decisionStatus,
  );
  const saveAction = saveDecisionActionV2.bind(null, {
    accountId: account.account_id,
    recommendedAction: recommendation.action,
    recommendedStateLabel: recommendation.stateLabel,
  });
  const interpretationSummary =
    interpretationResult.status === "available"
      ? interpretationResult.interpretation.overallSummary
      : interpretationResult.reason;
  const interpretationPrimaryDriver =
    interpretationResult.status === "available"
      ? interpretationResult.interpretation.primaryDriver
      : null;
  const selectedActionDescription = getActionLibraryItem(
    recommendation.action,
  )?.description;
  const interpretationMixedSignals =
    interpretationResult.status === "available"
      ? interpretationResult.interpretation.mixedSignals
      : [];
  const fullAccountData = Object.entries(account).filter(
    ([key]) => key !== "coercion_failures",
  );
  const coercionFailures = Object.entries(account.coercion_failures);

  return (
    <main className="portfolioV2Page">
      <div className="portfolioV2Shell">
        <ReviewerHeader homeHref="/portfolio-v2" showSignOut />

        <section className="portfolioV2Section portfolioV2Section--tightTop">
          <div className="portfolioV2SectionHeader">
            <div className="accountV2TitleBlock">
              <h1>{account.account_name ?? account.account_id}</h1>
              <div className="accountV2RankList">
                <span className="accountV2RankPill">
                  Risk rank {riskRank === null ? "Unavailable" : `#${riskRank}`}
                </span>
                <span className="accountV2RankPill">
                  Growth rank {growthRank === null ? "Unavailable" : `#${growthRank}`}
                </span>
              </div>
              <div className="accountV2Narrative">
                <p className="accountV2NarrativeSummary">{interpretationSummary}</p>
                <div className="accountV2NarrativeMeta">
                  <p>
                    <span className="accountV2FieldLabel">What matters most right now</span>
                    {interpretationPrimaryDriver ?? "Unavailable"}
                  </p>
                </div>
                {interpretationMixedSignals.length > 0 ? (
                  <div className="accountV2NarrativeSignals">
                    {interpretationMixedSignals.map((signal) => (
                      <span key={signal}>{signal}</span>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
            <Link className="portfolioV2SectionLink" href="/portfolio-v2">
              Back to portfolio
            </Link>
          </div>

          <div className="accountV2SummaryGrid">
            <div className="accountV2SummaryItem">
              <span>ARR</span>
              <strong>{formatCurrency(account.arr_gbp)}</strong>
            </div>
            <div className="accountV2SummaryItem">
              <span>Pipeline potential</span>
              <strong>{formatCurrency(review.pipelinePotential)}</strong>
            </div>
            <div className="accountV2SummaryItem">
              <span>Renewal date</span>
              <strong>{formatDate(review.renewal.renewalDate)}</strong>
            </div>
            <div className="accountV2SummaryItem">
              <span>Days to renewal</span>
              <strong>{formatCount(review.renewal.daysToRenewal)}</strong>
            </div>
          </div>
        </section>

        <section className="portfolioV2Section">
          <div className="portfolioV2SectionHeader">
            <h2>Account health</h2>
          </div>
          <div className="accountV2StateGrid">
            {review.states.map((state) => {
              const display = getStateDisplayValue(state.key, state.score);
              const label = state.status === "available"
                ? (display.band ?? "Unavailable")
                : "Unavailable";
              const secondary = state.status === "available"
                ? formatScore(display.displayScore)
                : "Unavailable";
              const tone = state.status === "available"
                ? (display.tone ?? "neutral")
                : "neutral";

              return (
                <article className="accountV2StateCard" key={state.key}>
                  <span className="accountV2StateLabel">{display.label}</span>
                  <div
                    className={`portfolioV2MetricBar accountV2StateMetric ${getCellToneClass(tone)}`}
                  >
                    <strong>{label}</strong>
                    <span>{secondary}</span>
                  </div>
                  <p className="accountV2StateMeta">
                    {state.status === "available"
                      ? `Confidence ${formatScore(state.confidence)}`
                      : (state.reason ?? "Unavailable")}
                  </p>
                </article>
              );
            })}
          </div>
          <div className="accountV2HealthNotes">
            <article className="accountV2NoteItem">
              <span className="accountV2FieldLabel">Recent customer note</span>
              <p>{account.recent_customer_note ?? "Unavailable"}</p>
            </article>
            <article className="accountV2NoteItem">
              <span className="accountV2FieldLabel">Recent sales note</span>
              <p>{account.recent_sales_note ?? "Unavailable"}</p>
            </article>
            <article className="accountV2NoteItem">
              <span className="accountV2FieldLabel">Recent support summary</span>
              <p>{account.recent_support_summary ?? "Unavailable"}</p>
            </article>
          </div>
        </section>

        <section className="portfolioV2Section">
          <div className="accountV2Block">
            <div className="portfolioV2SectionHeader">
              <h2>Recommended action</h2>
            </div>
            {decisionStatus ? (
              <p className={`status ${decisionStatus.tone}`}>{decisionStatus.text}</p>
            ) : null}
            <form action={saveAction} className="stack compact">
              <div className="accountV2ActionPlan">
                <div className="accountV2ActionLead">
                  <h3>{recommendation.action ?? "No recommended action"}</h3>
                  <p>
                    {selectedActionDescription ??
                      "Select an action to shape the execution plan."}
                  </p>
                </div>

                <dl className="accountV2ActionFacts">
                  <div>
                    <dt>Owner</dt>
                    <dd>{actionPlan?.owner ?? "Select an action to assign an owner"}</dd>
                  </div>
                  <div>
                    <dt>Suggested timing</dt>
                    <dd>{actionPlan?.suggestedTiming ?? "Unavailable"}</dd>
                  </div>
                  <div>
                    <dt>Success metric</dt>
                    <dd>{actionPlan?.successMetric ?? "Unavailable"}</dd>
                  </div>
                  <div>
                    <dt>What to check in 2 weeks</dt>
                    <dd>{actionPlan?.twoWeekCheck ?? "Unavailable"}</dd>
                  </div>
                </dl>

                <p className="accountV2TrackingText">
                  We will compare later account updates against today&apos;s baseline
                  across the relevant metrics to understand whether this
                  intervention is helping.
                </p>
              </div>
              <label className="field">
                <span className="accountV2FieldLabel">Action</span>
                <select
                  className="input accountV2Input"
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
              <label className="field">
                <span className="accountV2FieldLabel">Note</span>
                <textarea
                  className="input textarea accountV2Input"
                  name="userNote"
                  placeholder="Add short context for the saved decision."
                  rows={4}
                />
              </label>
              <button className="portfolioV2ActionLink accountV2Button" type="submit">
                Save decision
              </button>
            </form>

            <div className="portfolioV2SectionHeader">
              <h2>Decision history</h2>
            </div>
            {decisions.length === 0 ? (
              <p className="accountV2Empty">No decisions saved yet.</p>
            ) : (
              <div className="accountV2List">
                {decisions.map((decision, index) => (
                  <article
                    className="accountV2HistoryItem"
                    key={`${decision.accountId}-${decision.createdAt ?? index}`}
                  >
                    <div className="accountV2HistoryTop">
                      <strong>{decision.selectedAction}</strong>
                      <span>{decision.recommendationOutcome}</span>
                    </div>
                    <p>{formatDateTime(decision.createdAt)}</p>
                    <p>
                      Default: {decision.defaultRecommendedAction ?? "None"}
                      {decision.defaultRecommendedState
                        ? ` (${getStateDisplayLabelFromCanonicalLabel(
                            decision.defaultRecommendedState,
                          )})`
                        : ""}
                    </p>
                    <p>{decision.userNote ?? "No decision note added."}</p>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="portfolioV2Section">
          <div className="portfolioV2SectionHeader">
            <h2>Source record</h2>
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

              <div className="stack compact">
                <h3>Coercion fallbacks</h3>
                {coercionFailures.length === 0 ? (
                  <p>No invalid source values were preserved.</p>
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
      </div>
    </main>
  );
}
