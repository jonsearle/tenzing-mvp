import Link from "next/link";

import { SignOutButton } from "@/components/sign-out-button";
import { requireUser } from "@/lib/auth/session";
import { formatCount, formatCurrency, formatScore } from "@/lib/format";
import { getStateDisplayValue } from "@/lib/scoring/state-display";
import { getRankedGrowthAccounts } from "@/lib/scoring/growth-queue";
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

export default async function PortfolioPage() {
  const [user, riskAccounts, growthAccounts] = await Promise.all([
    requireUser("/portfolio"),
    getRankedRiskAccounts(),
    getRankedGrowthAccounts(),
  ]);
  const topRiskAccounts = riskAccounts.slice(0, 5);
  const topGrowthAccounts = growthAccounts.slice(0, 5);

  return (
    <main className="shell stack">
      <section className="hero stack">
        <div className="row-between">
          <div className="stack">
            <span className="eyebrow">Authenticated portfolio</span>
            <h1 className="title">Decision surface for risk and growth.</h1>
            <p className="subtitle">
              Signed in as {user.email ?? "authorised user"}. The homepage now
              shows the top five risk accounts and top five growth
              opportunities, with separate ranking models and direct links into
              account review.
            </p>
          </div>
          <SignOutButton />
        </div>
        <div className="grid cards">
          <article className="metric">
            <span className="eyebrow">Risk accounts surfaced</span>
            <strong>{topRiskAccounts.length}</strong>
            <span className="muted">Top five from the PRD risk model</span>
          </article>
          <article className="metric">
            <span className="eyebrow">Top growth priority</span>
            <strong>
              {topGrowthAccounts[0]
                ? formatScore(topGrowthAccounts[0].growthPriority, 1)
                : "Unavailable"}
            </strong>
            <span className="muted">
              Weighted by expansion opportunity and growth score
            </span>
          </article>
          <article className="metric">
            <span className="eyebrow">Highest risk priority</span>
            <strong>
              {topRiskAccounts[0]
                ? formatScore(topRiskAccounts[0].riskPriority, 1)
                : "Unavailable"}
            </strong>
            <span className="muted">Weighted by severity, ARR, and renewal</span>
          </article>
          <article className="metric">
            <span className="eyebrow">Nearest renewal</span>
            <strong>
              {topRiskAccounts[0]
                ? formatCount(topRiskAccounts[0].daysToRenewal)
                : "Unknown"}
            </strong>
            <span className="muted">Whole UTC calendar days to renewal</span>
          </article>
        </div>
        <div className="row">
          <Link className="button" href="/queue/risk">
            All Risk Accounts
          </Link>
          <Link className="buttonSecondary" href="/queue/growth">
            All Growth Accounts
          </Link>
          <Link className="buttonSecondary" href="/review">
            Manual Review Pass
          </Link>
        </div>
      </section>

      <section className="panel stack">
        <div className="row-between">
          <div>
            <h2>Biggest Risks</h2>
            <p className="muted">
              Ranked independently using the PRD risk model. The homepage stays
              focused on the top five accounts, with deeper evidence one click
              away on the account page.
            </p>
          </div>
          <span className="pill">Top 5 risk accounts</span>
        </div>
        <div className="tableWrap">
          <table className="table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Account</th>
                <th>ARR</th>
                <th>Service Health</th>
                <th>Relationship Strength</th>
                <th>Usage Momentum</th>
                <th>Adoption</th>
                <th>Customer Sentiment</th>
                <th>Days</th>
                <th>View</th>
              </tr>
            </thead>
            <tbody>
              {topRiskAccounts.map((account) => (
                <tr key={account.accountId}>
                  <td>{account.rank}</td>
                  <td>
                    <strong>{account.accountName}</strong>
                    <br />
                    <span className="muted">
                      Risk priority {formatScore(account.riskPriority, 1)}
                    </span>
                  </td>
                  <td>{formatCurrency(account.arrGbp)}</td>
                  <td>{renderStateCell("serviceFailure", account.serviceFailure)}</td>
                  <td>
                    {renderStateCell("relationshipRisk", account.relationshipRisk)}
                  </td>
                  <td>{renderStateCell("usageDecline", account.usageDecline)}</td>
                  <td>{renderStateCell("lowAdoption", account.lowAdoption)}</td>
                  <td>{renderStateCell("lowNps", account.lowNps)}</td>
                  <td>{formatCount(account.daysToRenewal)}</td>
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

      <section className="panel stack">
        <div className="row-between">
          <div>
            <h2>Best Growth Opportunities</h2>
            <p className="muted">
              Ranked separately from risk so commercial upside stays visible
              without being collapsed into downside severity.
            </p>
          </div>
          <span className="pill">Top 5 growth accounts</span>
        </div>
        <div className="tableWrap">
          <table className="table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Account</th>
                <th>ARR</th>
                <th>Pipeline Potential</th>
                <th>Expansion Confidence</th>
                <th>Confidence Band</th>
                <th>View</th>
              </tr>
            </thead>
            <tbody>
              {topGrowthAccounts.map((account) => (
                <tr key={account.accountId}>
                  <td>{account.rank}</td>
                  <td>
                    <strong>{account.accountName}</strong>
                    <br />
                    <span className="muted">
                      Growth priority {formatScore(account.growthPriority, 1)}
                    </span>
                  </td>
                  <td>{formatCurrency(account.arrGbp)}</td>
                  <td>{formatCurrency(account.pipelinePotential)}</td>
                  <td>{formatScore(account.expansionConfidence)}</td>
                  <td>{account.expansionConfidenceBand ?? "Unavailable"}</td>
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
