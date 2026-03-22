import Link from "next/link";

import { requireUser } from "@/lib/auth/session";
import { formatScore } from "@/lib/format";
import { buildManualProductReview } from "@/lib/review/manual-product-review";

function formatReviewedAt(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(new Date(value));
}

function formatRecommendationReason(reason: "highest_state" | "tie" | "all_zero") {
  switch (reason) {
    case "highest_state":
      return "Mapped from the single strongest state.";
    case "tie":
      return "No default because multiple states are tied for highest.";
    case "all_zero":
      return "No default because all surfaced state scores are zero.";
  }
}

export default async function ManualReviewPage() {
  await requireUser("/review");

  const review = await buildManualProductReview();

  return (
    <main className="shell stack">
      <section className="hero stack">
        <div className="row-between">
          <div className="stack">
            <span className="eyebrow">Manual review gate</span>
            <h1 className="title">Product review and ranking sanity pass.</h1>
            <p className="subtitle">
              This page is intentionally for human review against the PRD. It
              keeps the top-ranked risk and growth outputs, recommendation
              grounding, and evidence links in one place without turning the
              slice into a hidden implementation bucket.
            </p>
          </div>
          <Link className="buttonSecondary" href="/portfolio">
            Back to portfolio
          </Link>
        </div>
        <div className="grid cards">
          <article className="metric">
            <span className="eyebrow">Reviewed at</span>
            <strong>{formatReviewedAt(review.reviewedAt)}</strong>
            <span className="muted">UTC timestamp for this review snapshot</span>
          </article>
          <article className="metric">
            <span className="eyebrow">Risk accounts in pass</span>
            <strong>{review.riskEntries.length}</strong>
            <span className="muted">Top-ranked biggest-risks accounts</span>
          </article>
          <article className="metric">
            <span className="eyebrow">Growth accounts in pass</span>
            <strong>{review.growthEntries.length}</strong>
            <span className="muted">Top-ranked growth opportunities</span>
          </article>
          <article className="metric">
            <span className="eyebrow">Review log</span>
            <strong>docs/manual-product-review-2026-03-21.md</strong>
            <span className="muted">Separate place for findings and follow-ups</span>
          </article>
          <article className="metric">
            <span className="eyebrow">Legacy HTML</span>
            <strong>
              <Link href="/review/v5">Open v5 review artifact</Link>
            </strong>
            <span className="muted">Authenticated remote access to the saved HTML review</span>
          </article>
        </div>
      </section>

      <section className="panel stack">
        <div>
          <h2>Review checklist</h2>
          <p className="muted">
            These checks mirror the Linear issue boundary: ranking sanity,
            grounded evidence, decision-focused UI, and separate follow-up
            capture.
          </p>
        </div>
        <div className="stack compact">
          {review.checks.map((check) => (
            <article className="metric stack compact" key={check.label}>
              <div className="row-between">
                <strong>{check.label}</strong>
                <span className="pill">{check.status}</span>
              </div>
              <p className="muted">{check.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="panel stack">
        <div className="row-between">
          <div>
            <h2>Top risk accounts to sanity-check</h2>
            <p className="muted">
              Review whether the ranking, strongest signals, and recommended
              action feel defensible together.
            </p>
          </div>
          <span className="pill">Top 5 risk accounts</span>
        </div>
        <div className="reviewGrid">
          {review.riskEntries.map((entry) => (
            <article className="reviewCard stack compact" key={`risk-${entry.accountId}`}>
              <div className="row-between">
                <div>
                  <span className="eyebrow">Rank {entry.rank}</span>
                  <h3>{entry.accountName}</h3>
                </div>
                <span className="pill">{formatScore(entry.priorityValue, 1)}</span>
              </div>
              <p className="muted">
                {entry.priorityLabel}. Review account{" "}
                <strong>{entry.accountId}</strong>.
              </p>
              <div className="stack compact">
                <div>
                  <strong>Strongest signals</strong>
                  <p className="muted">
                    {entry.strongestSignals.length === 0
                      ? "No positive state scores surfaced."
                      : entry.strongestSignals
                          .map((signal) => `${signal.label} ${formatScore(signal.score)}`)
                          .join(", ")}
                  </p>
                </div>
                <div>
                  <strong>Recommended action</strong>
                  <p className="muted">
                    {entry.recommendationAction ?? "No recommended action - please select"}
                  </p>
                  <p className="muted">
                    {entry.recommendationStateLabel
                      ? `Prompting state: ${entry.recommendationStateLabel}. `
                      : ""}
                    {formatRecommendationReason(entry.recommendationReason)}
                  </p>
                </div>
                <div>
                  <strong>AI summary status</strong>
                  <p className="muted">
                    {entry.aiStatus === "available"
                      ? entry.aiSummary
                      : entry.aiReason ?? "AI interpretation unavailable."}
                  </p>
                </div>
                <div>
                  <strong>Evidence fields present</strong>
                  <p className="muted">
                    {entry.noteEvidenceLabels.length === 0
                      ? "No source note fields available."
                      : entry.noteEvidenceLabels.join(", ")}
                  </p>
                </div>
              </div>
              <Link className="buttonSecondary" href={entry.reviewHref}>
                Open account evidence
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="panel stack">
        <div className="row-between">
          <div>
            <h2>Top growth accounts to sanity-check</h2>
            <p className="muted">
              Review whether upside ranking still feels grounded rather than
              opaque once recommendation context and evidence are visible.
            </p>
          </div>
          <span className="pill">Top 5 growth accounts</span>
        </div>
        <div className="reviewGrid">
          {review.growthEntries.map((entry) => (
            <article
              className="reviewCard stack compact"
              key={`growth-${entry.accountId}`}
            >
              <div className="row-between">
                <div>
                  <span className="eyebrow">Rank {entry.rank}</span>
                  <h3>{entry.accountName}</h3>
                </div>
                <span className="pill">{formatScore(entry.priorityValue, 1)}</span>
              </div>
              <p className="muted">
                {entry.priorityLabel}. Review account{" "}
                <strong>{entry.accountId}</strong>.
              </p>
              <div className="stack compact">
                <div>
                  <strong>Strongest signals</strong>
                  <p className="muted">
                    {entry.strongestSignals.length === 0
                      ? "No positive state scores surfaced."
                      : entry.strongestSignals
                          .map((signal) => `${signal.label} ${formatScore(signal.score)}`)
                          .join(", ")}
                  </p>
                </div>
                <div>
                  <strong>Recommended action</strong>
                  <p className="muted">
                    {entry.recommendationAction ?? "No recommended action - please select"}
                  </p>
                  <p className="muted">
                    {entry.recommendationStateLabel
                      ? `Prompting state: ${entry.recommendationStateLabel}. `
                      : ""}
                    {formatRecommendationReason(entry.recommendationReason)}
                  </p>
                </div>
                <div>
                  <strong>AI summary status</strong>
                  <p className="muted">
                    {entry.aiStatus === "available"
                      ? entry.aiSummary
                      : entry.aiReason ?? "AI interpretation unavailable."}
                  </p>
                </div>
                <div>
                  <strong>Evidence fields present</strong>
                  <p className="muted">
                    {entry.noteEvidenceLabels.length === 0
                      ? "No source note fields available."
                      : entry.noteEvidenceLabels.join(", ")}
                  </p>
                </div>
              </div>
              <Link className="buttonSecondary" href={entry.reviewHref}>
                Open account evidence
              </Link>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
