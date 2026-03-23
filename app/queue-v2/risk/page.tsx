import Link from "next/link";

import { ReviewerHeader } from "@/components/reviewer-header";
import { requireUser } from "@/lib/auth/session";
import { formatCount, formatCurrency } from "@/lib/format";
import { getRankedRiskAccounts } from "@/lib/scoring/risk-queue";
import {
  buildTopAccountDetails,
  getCellToneClass,
  getQueueNarrative,
  getRiskCell,
  RISK_STATE_KEYS,
  truncateAccountName,
} from "@/app/portfolio-v2/view-model";

export default async function RiskQueueV2Page() {
  await requireUser("/queue-v2/risk");

  const rankedAccounts = await getRankedRiskAccounts();
  const accountDetails = await buildTopAccountDetails(
    rankedAccounts.map((account) => account.accountId),
  );

  return (
    <main className="portfolioV2Page">
      <div className="portfolioV2Shell">
        <ReviewerHeader homeHref="/portfolio-v2" showSignOut />

        <section className="portfolioV2Section portfolioV2Section--tightTop">
          <div className="portfolioV2SectionHeader">
            <h1>All Accounts Ranked by Risk</h1>
            <Link className="portfolioV2SectionLink" href="/portfolio-v2">
              Back to portfolio
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
                {rankedAccounts.map((account) => (
                  <tr key={account.accountId}>
                    <td className="portfolioV2Rank">{account.rank}</td>
                    <td className="portfolioV2Account">
                      <div className="portfolioV2AccountBlock">
                        <span title={account.accountName}>
                          {truncateAccountName(account.accountName)}
                        </span>
                        {getQueueNarrative(accountDetails, account.accountId) ? (
                          <p className="portfolioV2AccountNarrative">
                            {getQueueNarrative(accountDetails, account.accountId)}
                          </p>
                        ) : null}
                      </div>
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
                        accountDetails,
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
      </div>
    </main>
  );
}
