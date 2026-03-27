import Link from "next/link";

import { ReviewerHeader } from "@/components/reviewer-header";
import { requireUser } from "@/lib/auth/session";
import { formatCount, formatCurrency, formatScore } from "@/lib/format";
import { getRankedGrowthAccounts } from "@/lib/scoring/growth-queue";
import { getRankedRiskAccounts } from "@/lib/scoring/risk-queue";
import {
  buildTopAccountDetails,
  getCellToneClass,
  getExpansionConfidenceCell,
  getGrowthOpportunityCell,
  getRiskCell,
  RISK_STATE_KEYS,
  truncateAccountName,
} from "./view-model";

export default async function PortfolioV2Page() {
  await requireUser("/portfolio-v2");

  const [riskAccounts, growthAccounts] = await Promise.all([
    getRankedRiskAccounts(),
    getRankedGrowthAccounts(),
  ]);
  const totalAccountArr = riskAccounts.reduce(
    (sum, account) => sum + (account.arrGbp ?? 0),
    0,
  );

  const topRiskAccounts = riskAccounts.slice(0, 5);
  const topGrowthAccounts = growthAccounts.slice(0, 5);
  const topAccountIds = Array.from(
    new Set([
      ...topRiskAccounts.map((account) => account.accountId),
      ...topGrowthAccounts.map((account) => account.accountId),
    ]),
  );
  const topAccountDetails = await buildTopAccountDetails(topAccountIds);

  return (
    <main className="portfolioV2Page">
      <div className="portfolioV2Shell">
        <ReviewerHeader homeHref="/portfolio-v2" showSignOut />

        <section className="portfolioV2Section portfolioV2Section--tightTop">
          <div className="portfolioV2SectionHeader portfolioV2SectionHeader--hero">
            <div>
              <h1>Portfolio overview</h1>
            </div>
            <article className="portfolioV2HighlightStat" aria-label="Total account ARR">
              <span>Total account ARR</span>
              <strong>{formatCurrency(totalAccountArr)}</strong>
            </article>
          </div>
        </section>

        <section className="portfolioV2Section">
          <div className="portfolioV2SectionHeader">
            <h2>Top 5 At-Risk Accounts</h2>
            <Link className="portfolioV2SectionLink" href="/queue-v2/risk">
              View all accounts ranked by risk
            </Link>
          </div>

          <div className="portfolioV2TableWrap">
            <table className="portfolioV2Table portfolioV2RiskTable">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Account</th>
                  <th>ARR</th>
                  <th>Service Health</th>
                  <th>Usage Momentum</th>
                  <th>Adoption</th>
                  <th>Customer Sentiment</th>
                  <th>Days to renewal</th>
                  <th>View</th>
                </tr>
              </thead>
              <tbody>
                {topRiskAccounts.map((account) => (
                  <tr key={account.accountId}>
                    <td className="portfolioV2Rank">{account.rank}</td>
                    <td className="portfolioV2Account">
                      <span title={account.accountName}>
                        {truncateAccountName(account.accountName)}
                      </span>
                    </td>
                    <td className="portfolioV2Arr">{formatCurrency(account.arrGbp)}</td>
                    {RISK_STATE_KEYS.map((key) => {
                      const fallbackScore =
                        key === "serviceFailure"
                          ? account.serviceFailure
                          : key === "usageDecline"
                            ? account.usageDecline
                            : key === "lowAdoption"
                              ? account.lowAdoption
                              : account.lowNps;
                      const cell = getRiskCell(
                        topAccountDetails,
                        account.accountId,
                        key,
                        fallbackScore,
                      );

                      return (
                        <td key={key}>
                          <div
                            className={`portfolioV2MetricCell ${getCellToneClass(cell.tone)}`}
                          >
                            <strong>{cell.label}</strong>
                            <span>{cell.score}</span>
                          </div>
                        </td>
                      );
                    })}
                    <td>
                      <div className="portfolioV2MetricCell tone-neutral">
                        <strong>
                          {account.daysToRenewal === null
                            ? "Unavailable"
                            : formatCount(account.daysToRenewal)}
                        </strong>
                        <span>
                          {account.daysToRenewal === null ? "Unavailable" : "days"}
                        </span>
                      </div>
                    </td>
                    <td className="portfolioV2ActionCell">
                      <Link
                        className="portfolioV2ActionLink"
                        href={`/accounts-v2/${account.accountId}`}
                        prefetch={false}
                      >
                        View account
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="portfolioV2Section">
          <div className="portfolioV2SectionHeader">
            <h2>Top 5 Growth Opportunities</h2>
            <Link className="portfolioV2SectionLink" href="/queue-v2/growth">
              View all accounts ranked by growth opportunity
            </Link>
          </div>

          <div className="portfolioV2TableWrap">
            <table className="portfolioV2Table portfolioV2GrowthTable">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Account</th>
                  <th>ARR</th>
                  <th>Pipeline potential</th>
                  <th>Growth Opportunity</th>
                  <th>Expansion Confidence</th>
                  <th>View</th>
                </tr>
              </thead>
              <tbody>
                {topGrowthAccounts.map((account) => {
                  const opportunityCell = getGrowthOpportunityCell(
                    topAccountDetails,
                    account.accountId,
                    account.expansionOpportunity,
                  );
                  const confidenceCell = getExpansionConfidenceCell(
                    topAccountDetails,
                    account.accountId,
                  );

                  return (
                    <tr key={account.accountId}>
                      <td className="portfolioV2Rank">{account.rank}</td>
                      <td className="portfolioV2Account">
                        <span title={account.accountName}>
                          {truncateAccountName(account.accountName)}
                        </span>
                      </td>
                      <td className="portfolioV2Arr">
                        {formatCurrency(account.arrGbp)}
                      </td>
                      <td className="portfolioV2Arr">
                        {formatCurrency(account.pipelinePotential)}
                      </td>
                      <td>
                        <div
                          className={`portfolioV2MetricBar ${getCellToneClass(
                            opportunityCell.tone,
                          )}`}
                        >
                          <strong>{opportunityCell.label}</strong>
                          <span>{opportunityCell.score}</span>
                        </div>
                      </td>
                      <td>
                        <div
                          className={`portfolioV2MetricBar ${getCellToneClass(
                            confidenceCell.tone,
                          )}`}
                        >
                          <strong>{confidenceCell.label}</strong>
                          <span>{confidenceCell.score}</span>
                        </div>
                      </td>
                      <td className="portfolioV2ActionCell">
                        <Link
                          className="portfolioV2ActionLink"
                          href={`/accounts-v2/${account.accountId}`}
                          prefetch={false}
                        >
                          View account
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
