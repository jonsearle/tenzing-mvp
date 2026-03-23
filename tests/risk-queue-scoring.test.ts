import {
  computeStructuredAccountReview,
  computeStructuredStateAssessments,
} from "@/lib/scoring/account-detail";
import {
  computePercentileRankScores,
  rankRiskAccounts,
} from "@/lib/scoring/risk-queue";
import type { AccountNoteInterpretationResult } from "@/lib/notes/interpretation";
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
    open_tickets_count: 3,
    urgent_open_tickets_count: 4,
    sla_breaches_90d: 1,
    avg_csat_90d: null,
    mrr_3m_ago_gbp: null,
    mrr_current_gbp: null,
    usage_score_3m_ago: 80,
    usage_score_current: 50,
    overdue_amount_gbp: null,
    expansion_pipeline_gbp: 40000,
    contraction_risk_gbp: null,
    contract_start_date: null,
    renewal_date: "2026-04-15",
    last_lead_activity_date: null,
    last_qbr_date: null,
    latest_note_date: null,
    ...overrides,
  };
}

function createInterpretationResult(
  accountId: string,
  overrides: Partial<AccountNoteInterpretationResult> = {},
): AccountNoteInterpretationResult {
  return {
    status: "available",
    source: "live",
    interpretation: {
      accountId,
      normalizedNoteText: "customer notes\n\nsales notes\n\nsupport notes",
      overallSummary: "Account summary.",
      relationshipVibe: "negative",
      growthVibe: "positive",
      primaryDriver: "Service risk is the main issue.",
      recommendedActionSummary: "Run a service stabilisation plan.",
      confidence: "medium",
      mixedSignals: [],
      createdAt: null,
      updatedAt: null,
    },
    ...overrides,
  } as AccountNoteInterpretationResult;
}

function buildRankingInput(
  account: NormalizedAccountRecord,
  interpretation: AccountNoteInterpretationResult,
) {
  return {
    account,
    review: computeStructuredAccountReview(
      account,
      interpretation,
      new Date("2026-03-21T00:00:00.000Z"),
    ),
    assessments: computeStructuredStateAssessments(account, interpretation),
  };
}

describe("risk queue ranking", () => {
  it("uses averaged percentile positions for tied importance values", () => {
    const scores = computePercentileRankScores([
      { accountId: "ACC-1", value: 100 },
      { accountId: "ACC-2", value: 100 },
      { accountId: "ACC-3", value: 300 },
    ]);

    expect(scores.get("ACC-1")).toBe(25);
    expect(scores.get("ACC-2")).toBe(25);
    expect(scores.get("ACC-3")).toBe(100);
  });

  it("applies renewal urgency buckets inside the final risk priority", () => {
    const sooner = createAccount("ACC-SOON", {
      renewal_date: "2026-04-10",
    });
    const later = createAccount("ACC-LATER", {
      renewal_date: "2026-08-18",
    });
    const interpretationSooner = createInterpretationResult("ACC-SOON");
    const interpretationLater = createInterpretationResult("ACC-LATER");

    const ranked = rankRiskAccounts([
      buildRankingInput(sooner, interpretationSooner),
      buildRankingInput(later, interpretationLater),
    ]);

    expect(ranked[0].accountId).toBe("ACC-SOON");
    expect(ranked[0].renewalScore).toBe(100);
    expect(ranked[1].renewalScore).toBe(25);
    expect(ranked[0].riskPriority).toBeGreaterThan(ranked[1].riskPriority);
  });

  it("keeps ordering deterministic when all rank inputs tie", () => {
    const ranked = rankRiskAccounts([
      buildRankingInput(
        createAccount("ACC-B"),
        createInterpretationResult("ACC-B"),
      ),
      buildRankingInput(
        createAccount("ACC-A"),
        createInterpretationResult("ACC-A"),
      ),
    ]);

    expect(ranked.map((account) => account.accountId)).toEqual([
      "ACC-A",
      "ACC-B",
    ]);
  });

  it("does not let relationship vibe alone change the risk ordering", () => {
    const sharedOverrides = {
      arr_gbp: 150000,
      expansion_pipeline_gbp: 20000,
      renewal_date: "2026-05-01",
      urgent_open_tickets_count: 3,
      open_tickets_count: 3,
      sla_breaches_90d: 1,
      usage_score_3m_ago: 80,
      usage_score_current: 50,
      seats_purchased: 100,
      seats_used: 20,
      latest_nps: -10,
    } satisfies Partial<NormalizedAccountRecord>;

    const ranked = rankRiskAccounts([
      buildRankingInput(
        createAccount("ACC-NEGATIVE", sharedOverrides),
        createInterpretationResult("ACC-NEGATIVE", {
          interpretation: {
            ...createInterpretationResult("ACC-NEGATIVE").interpretation,
            relationshipVibe: "negative",
          },
        }),
      ),
      buildRankingInput(
        createAccount("ACC-POSITIVE", sharedOverrides),
        createInterpretationResult("ACC-POSITIVE", {
          interpretation: {
            ...createInterpretationResult("ACC-POSITIVE").interpretation,
            relationshipVibe: "positive",
          },
        }),
      ),
    ]);

    expect(ranked.map((account) => account.accountId)).toEqual([
      "ACC-NEGATIVE",
      "ACC-POSITIVE",
    ]);
    expect(ranked[0].riskPriority).toBe(ranked[1].riskPriority);
    expect(ranked[0].relationshipRisk).toBeGreaterThan(
      ranked[1].relationshipRisk,
    );
  });
});
