import Link from "next/link";

import { requireUser } from "@/lib/auth/session";
import { formatCount, formatCurrency, formatDate, formatScore } from "@/lib/format";
import { getStateDisplayValue } from "@/lib/scoring/state-display";
import { getRankedRiskAccounts } from "@/lib/scoring/risk-queue";

function renderStateCell(
  key:
    | "serviceFailure"
    | "relationshipRisk"
    | "usageDecline"
    | "lowAdoption"
    | "lowNps",
  score: number,
) {
  const display = getStateDisplayValue(key, score);

  return (
    <>
      <strong>{display.band}</strong>
      <br />
      <span className="muted">{formatScore(display.displayScore)}/100</span>
    </>
  );
}

export default async function RiskQueuePage() {
  const [, rankedAccounts] = await Promise.all([
    requireUser("/queue/risk"),
    getRankedRiskAccounts(),
  ]);

  return (
    <main className="shell stack">
      <section className="hero stack">
        <div className="row-between">
          <div className="stack">
            <span className="eyebrow">All Risk Accounts</span>
            <h1 className="title">Full biggest-risks queue.</h1>
            <p className="subtitle">
              Accounts are sorted by final risk priority, with deterministic
              percentile normalization, renewal urgency, and PRD tie-breakers.
            </p>
          </div>
          <Link className="buttonSecondary" href="/portfolio">
            Back to homepage
          </Link>
        </div>
      </section>

      <section className="panel stack">
        <div className="row-between">
          <div>
            <h2>Risk review table</h2>
            <p className="muted">
              Review the full portfolio ranking, then drill into the account
              page for notes, AI summary, and source evidence.
            </p>
          </div>
          <span className="pill">{rankedAccounts.length} accounts ranked</span>
        </div>
        <div className="tableWrap">
          <table className="table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Account</th>
                <th>ARR £</th>
                <th>Renewal Date</th>
                <th>Days</th>
                <th>Renewal Score</th>
                <th>ARR+Potential Score</th>
                <th>Risk Severity</th>
                <th>Risk Priority</th>
                <th>Service Health</th>
                <th>Relationship Strength</th>
                <th>Usage Momentum</th>
                <th>Adoption</th>
                <th>Customer Sentiment</th>
                <th>View</th>
              </tr>
            </thead>
            <tbody>
              {rankedAccounts.map((account) => (
                <tr key={account.accountId}>
                  <td>{account.rank}</td>
                  <td>
                    <strong>{account.accountName}</strong>
                    <br />
                    <span className="muted">{account.accountId}</span>
                  </td>
                  <td>{formatCurrency(account.arrGbp)}</td>
                  <td>{formatDate(account.renewalDate)}</td>
                  <td>{formatCount(account.daysToRenewal)}</td>
                  <td>{formatScore(account.renewalScore)}</td>
                  <td>{formatScore(account.arrPotentialScore, 1)}</td>
                  <td>{formatScore(account.riskSeverity, 1)}</td>
                  <td>{formatScore(account.riskPriority, 1)}</td>
                  <td>{renderStateCell("serviceFailure", account.serviceFailure)}</td>
                  <td>
                    {renderStateCell("relationshipRisk", account.relationshipRisk)}
                  </td>
                  <td>{renderStateCell("usageDecline", account.usageDecline)}</td>
                  <td>{renderStateCell("lowAdoption", account.lowAdoption)}</td>
                  <td>{renderStateCell("lowNps", account.lowNps)}</td>
                  <td>
                    <Link
                      className="buttonSecondary"
                      href={`/accounts/${account.accountId}`}
                      prefetch={false}
                    >
                      Open account
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
