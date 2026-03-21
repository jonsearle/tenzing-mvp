import Link from "next/link";

import { requireUser } from "@/lib/auth/session";
import { formatCount, formatCurrency, formatDate, formatScore } from "@/lib/format";
import { getRankedGrowthAccounts } from "@/lib/scoring/growth-queue";

export default async function GrowthQueuePage() {
  const [, rankedAccounts] = await Promise.all([
    requireUser("/queue/growth"),
    getRankedGrowthAccounts(),
  ]);

  return (
    <main className="shell stack">
      <section className="hero stack">
        <div className="row-between">
          <div className="stack">
            <span className="eyebrow">All Growth Accounts</span>
            <h1 className="title">Full growth-opportunities queue.</h1>
            <p className="subtitle">
              Accounts are sorted by final growth priority, using PRD-defined
              importance percentiles, clamped expansion opportunity, and
              deterministic tie-breakers.
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
            <h2>Growth review table</h2>
            <p className="muted">
              Review the full growth ranking, then open the account page for AI
              summary, notes, and supporting evidence.
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
                <th>Growth Score</th>
                <th>Expansion Opportunity</th>
                <th>Expansion Confidence</th>
                <th>Expansion Confidence Band</th>
                <th>Growth Priority</th>
                <th>Service Failure</th>
                <th>Relationship Risk</th>
                <th>Usage Decline</th>
                <th>Low Adoption</th>
                <th>Low NPS</th>
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
                  <td>{formatScore(account.growthScore, 1)}</td>
                  <td>{formatScore(account.expansionOpportunity, 1)}</td>
                  <td>{formatScore(account.expansionConfidence)}</td>
                  <td>{account.expansionConfidenceBand ?? "Unavailable"}</td>
                  <td>{formatScore(account.growthPriority, 1)}</td>
                  <td>{formatScore(account.serviceFailure)}</td>
                  <td>{formatScore(account.relationshipRisk)}</td>
                  <td>{formatScore(account.usageDecline)}</td>
                  <td>{formatScore(account.lowAdoption)}</td>
                  <td>{formatScore(account.lowNps)}</td>
                  <td>
                    <Link
                      className="buttonSecondary"
                      href={`/accounts/${account.accountId}`}
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
