import Link from "next/link";

import { ReviewerHeader } from "@/components/reviewer-header";
import { requireUser } from "@/lib/auth/session";
import { formatCurrency } from "@/lib/format";
import { getRankedGrowthAccounts } from "@/lib/scoring/growth-queue";
import {
  buildTopAccountDetails,
  getCellToneClass,
  getExpansionConfidenceCell,
  getGrowthOpportunityCell,
  getQueueNarrative,
  truncateAccountName,
} from "@/app/portfolio-v2/view-model";

export default async function GrowthQueueV2Page() {
  await requireUser("/queue-v2/growth");

  const rankedAccounts = await getRankedGrowthAccounts();
  const accountDetails = await buildTopAccountDetails(
    rankedAccounts.map((account) => account.accountId),
  );

  return (
    <main className="portfolioV2Page">
      <div className="portfolioV2Shell">
        <ReviewerHeader homeHref="/portfolio-v2" showSignOut />

        <section className="portfolioV2Section portfolioV2Section--tightTop">
          <div className="portfolioV2SectionHeader">
            <h1>All Accounts Ranked by Growth Opportunity</h1>
            <Link className="portfolioV2SectionLink" href="/portfolio-v2">
              Back to portfolio
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
                {rankedAccounts.map((account) => {
                  const opportunityCell = getGrowthOpportunityCell(
                    accountDetails,
                    account.accountId,
                    account.expansionOpportunity,
                  );
                  const confidenceCell = getExpansionConfidenceCell(
                    accountDetails,
                    account.accountId,
                  );

                  return (
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
