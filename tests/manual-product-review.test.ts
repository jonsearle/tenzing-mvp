import { describe, expect, it } from "vitest";

import { buildManualProductReview } from "@/lib/review/manual-product-review";
import type { RankedGrowthAccount } from "@/lib/scoring/growth-queue";
import type { RankedRiskAccount } from "@/lib/scoring/risk-queue";
import type { NormalizedAccountRecord } from "@/types/account";

function createAccount(
  accountId: string,
  overrides: Partial<NormalizedAccountRecord> = {},
): NormalizedAccountRecord {
  return {
    account_id: accountId,
    row_number: 2,
    coercion_failures: {},
    external_account_ref: null,
    account_name: `${accountId} Co`,
    website: null,
    industry: null,
    segment: null,
    region: null,
    account_status: null,
    lifecycle_stage: null,
    account_owner: null,
    csm_owner: null,
    support_tier: null,
    billing_frequency: null,
    billing_currency: null,
    note_sentiment_hint: null,
    recent_support_summary: "Support notes",
    recent_customer_note: "Customer notes",
    recent_sales_note: "Sales notes",
    arr_gbp: 100000,
    seats_purchased: 100,
    seats_used: 20,
    latest_nps: -10,
    open_leads_count: null,
    avg_lead_score: null,
    open_tickets_count: 4,
    urgent_open_tickets_count: 2,
    sla_breaches_90d: 1,
    avg_csat_90d: null,
    mrr_3m_ago_gbp: null,
    mrr_current_gbp: null,
    usage_score_3m_ago: 80,
    usage_score_current: 45,
    overdue_amount_gbp: null,
    expansion_pipeline_gbp: 50000,
    contraction_risk_gbp: null,
    contract_start_date: null,
    renewal_date: "2026-04-15",
    last_lead_activity_date: null,
    last_qbr_date: null,
    latest_note_date: null,
    ...overrides,
  };
}

function createRiskAccount(rank: number, accountId: string): RankedRiskAccount {
  return {
    rank,
    accountId,
    accountName: `${accountId} Co`,
    arrGbp: 100000,
    renewalDate: "2026-04-15",
    daysToRenewal: 25,
    renewalScore: 100,
    arrPotentialScore: 85,
    riskSeverity: 71.2,
    riskPriority: 78.6,
    serviceFailure: 80,
    relationshipRisk: 60,
    usageDecline: 75,
    lowAdoption: 65,
    lowNps: 55,
  };
}

function createGrowthAccount(
  rank: number,
  accountId: string,
): RankedGrowthAccount {
  return {
    rank,
    accountId,
    accountName: `${accountId} Co`,
    arrGbp: 100000,
    renewalDate: "2026-04-15",
    daysToRenewal: 25,
    pipelinePotential: 50000,
    growthScore: 88,
    expansionOpportunity: 92,
    expansionConfidence: 100,
    expansionConfidenceBand: "Confident",
    growthPriority: 90.6,
    serviceFailure: 20,
    relationshipRisk: 10,
    usageDecline: 15,
    lowAdoption: 25,
    lowNps: 5,
  };
}

describe("manual product review", () => {
  it("builds top-five review entries with recommendation and evidence context", async () => {
    const accounts = new Map(
      Array.from({ length: 5 }, (_, index) => {
        const accountId = `ACC-R${index + 1}`;
        return [accountId, createAccount(accountId)];
      }).concat(
        Array.from({ length: 5 }, (_, index) => {
          const accountId = `ACC-G${index + 1}`;
          return [accountId, createAccount(accountId)];
        }),
      ),
    );

    const review = await buildManualProductReview(
      new Date("2026-03-21T00:00:00.000Z"),
      {
        getRiskAccounts: async () =>
          Array.from({ length: 5 }, (_, index) =>
            createRiskAccount(index + 1, `ACC-R${index + 1}`),
          ),
        getGrowthAccounts: async () =>
          Array.from({ length: 5 }, (_, index) =>
            createGrowthAccount(index + 1, `ACC-G${index + 1}`),
          ),
        findAccount: async (accountId) => accounts.get(accountId) ?? null,
        getInterpretation: async (account) => ({
          status: "available",
          source: "live",
          interpretation: {
            accountId: account.account_id,
            normalizedNoteText:
              "customer notes\n\nsales notes\n\nsupport notes",
            overallSummary: `Summary for ${account.account_id}.`,
            relationshipVibe: "negative",
            growthVibe: "positive",
            primaryDriver: "Relationship risk is the lead signal.",
            recommendedActionSummary: "Reset the relationship before expanding.",
            confidence: "medium",
            mixedSignals: ["Sales notes still mention upside."],
            createdAt: null,
            updatedAt: null,
          },
        }),
      },
    );

    expect(review.riskEntries).toHaveLength(5);
    expect(review.growthEntries).toHaveLength(5);
    expect(review.riskEntries[0]).toMatchObject({
      queue: "risk",
      accountId: "ACC-R1",
      recommendationAction: null,
      recommendationReason: "tie",
      aiStatus: "available",
      noteEvidenceLabels: [
        "Recent customer note",
        "Recent sales note",
        "Recent support summary",
      ],
      reviewHref: "/accounts/ACC-R1",
    });
    expect(review.growthEntries[0]).toMatchObject({
      queue: "growth",
      accountId: "ACC-G1",
      recommendationAction: null,
      recommendationReason: "tie",
      aiStatus: "available",
    });
    expect(review.checks).toHaveLength(4);
  });
});
