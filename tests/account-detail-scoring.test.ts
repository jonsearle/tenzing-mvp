import {
  computeStructuredAccountReview,
  getExpansionConfidenceBand,
  getExpansionConfidenceScore,
  getDaysToRenewal,
  getRenewalScore,
} from "@/lib/scoring/account-detail";
import type { AccountNoteInterpretationResult } from "@/lib/notes/interpretation";
import type { NormalizedAccountRecord } from "@/types/account";

function createAccount(
  overrides: Partial<NormalizedAccountRecord> = {},
): NormalizedAccountRecord {
  return {
    account_id: "ACC-123",
    row_number: 2,
    coercion_failures: {},
    external_account_ref: null,
    account_name: "Example Co",
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
    recent_support_summary: null,
    recent_customer_note: null,
    recent_sales_note: null,
    arr_gbp: 120000,
    seats_purchased: 100,
    seats_used: 20,
    latest_nps: -10,
    open_leads_count: null,
    avg_lead_score: null,
    open_tickets_count: 3,
    urgent_open_tickets_count: 4,
    sla_breaches_90d: null,
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
  overrides: Partial<AccountNoteInterpretationResult> = {},
): AccountNoteInterpretationResult {
  return {
    status: "available",
    source: "live",
    interpretation: {
      accountId: "ACC-123",
      normalizedNoteText:
        "customer is unhappy\n\nsales sees upside\n\nsupport reports churn risk",
      overallSummary: "The account shows delivery pressure with mixed commercial upside.",
      relationshipVibe: "negative",
      growthVibe: "positive",
      createdAt: null,
      updatedAt: null,
    },
    ...overrides,
  } as AccountNoteInterpretationResult;
}

describe("account detail structured scoring", () => {
  it("applies service failure hard rules and completeness weighting", () => {
    const review = computeStructuredAccountReview(
      createAccount({
        open_tickets_count: 3,
        urgent_open_tickets_count: 4,
        sla_breaches_90d: null,
      }),
      null,
      new Date("2026-03-21T00:00:00.000Z"),
    );

    expect(review.states[0]).toMatchObject({
      key: "serviceFailure",
      score: 50,
      confidence: 67,
      status: "available",
    });
  });

  it("keeps low adoption deterministic when seat utilisation triggers the hard rule", () => {
    const review = computeStructuredAccountReview(
      createAccount({
        seats_purchased: 120,
        seats_used: 20,
      }),
      null,
      new Date("2026-03-21T00:00:00.000Z"),
    );

    expect(review.states[1]).toMatchObject({
      key: "lowAdoption",
      score: 83,
      confidence: 100,
      status: "available",
    });
  });

  it("returns zero structured score when required inputs are missing while reducing confidence", () => {
    const review = computeStructuredAccountReview(
      createAccount({
        seats_purchased: 100,
        seats_used: null,
      }),
      null,
      new Date("2026-03-21T00:00:00.000Z"),
    );

    expect(review.states[1]).toMatchObject({
      key: "lowAdoption",
      score: 0,
      confidence: 50,
      status: "available",
    });
  });

  it("computes usage decline and low NPS on the PRD display scale", () => {
    const review = computeStructuredAccountReview(
      createAccount({
        usage_score_3m_ago: 90,
        usage_score_current: 60,
        latest_nps: -20,
      }),
      null,
      new Date("2026-03-21T00:00:00.000Z"),
    );

    expect(review.states[2]).toMatchObject({
      key: "usageDecline",
      score: 75,
      confidence: 100,
      status: "available",
    });
    expect(review.states[5]).toMatchObject({
      key: "lowNps",
      score: 70,
      confidence: 100,
      status: "available",
    });
  });

  it("maps growth vibes into expansion confidence outputs", () => {
    expect(getExpansionConfidenceScore("positive")).toBe(100);
    expect(getExpansionConfidenceScore("neutral")).toBe(50);
    expect(getExpansionConfidenceScore("negative")).toBe(0);
    expect(getExpansionConfidenceBand("positive")).toBe("Confident");
    expect(getExpansionConfidenceBand("neutral")).toBe("Neutral");
    expect(getExpansionConfidenceBand("negative")).toBe("Not Confident");
  });

  it("marks AI-derived states as unavailable when interpretation is unavailable", () => {
    const review = computeStructuredAccountReview(
      createAccount(),
      {
        status: "unavailable",
        source: "empty",
        reason: "AI interpretation unavailable because all note fields are empty.",
        normalizedNoteText: null,
      },
      new Date("2026-03-21T00:00:00.000Z"),
    );

    expect(review.states[3]).toMatchObject({
      key: "relationshipRisk",
      score: null,
      confidence: null,
      status: "unavailable",
      reason: "AI interpretation unavailable because all note fields are empty.",
    });
    expect(review.states[4]).toMatchObject({
      key: "expansionOpportunity",
      score: null,
      confidence: null,
      status: "unavailable",
      reason: "AI interpretation unavailable because all note fields are empty.",
    });
    expect(review.expansionConfidenceScore).toBeNull();
    expect(review.expansionConfidenceBand).toBeNull();
  });

  it("computes AI-informed states from the interpreted vibes and completeness rules", () => {
    const review = computeStructuredAccountReview(
      createAccount({
        recent_customer_note: "Concerned about missed commitments",
        recent_sales_note: "Strong appetite for wider rollout",
        recent_support_summary: null,
        expansion_pipeline_gbp: 40000,
      }),
      createInterpretationResult(),
      new Date("2026-03-21T00:00:00.000Z"),
    );

    expect(review.states[3]).toMatchObject({
      key: "relationshipRisk",
      score: 67,
      confidence: 67,
      status: "available",
    });
    expect(review.states[4]).toMatchObject({
      key: "expansionOpportunity",
      score: 90,
      confidence: 100,
      status: "available",
    });
    expect(review.expansionConfidenceScore).toBe(100);
    expect(review.expansionConfidenceBand).toBe("Confident");
  });

  it("computes renewal context from whole UTC calendar days", () => {
    expect(getDaysToRenewal("2026-03-25", new Date("2026-03-21T15:00:00.000Z"))).toBe(4);
    expect(getDaysToRenewal("2026-03-01", new Date("2026-03-21T15:00:00.000Z"))).toBe(0);
    expect(getRenewalScore(0)).toBe(100);
    expect(getRenewalScore(45)).toBe(75);
    expect(getRenewalScore(90)).toBe(50);
    expect(getRenewalScore(150)).toBe(25);
    expect(getRenewalScore(240)).toBe(0);
    expect(getRenewalScore(null)).toBe(0);
  });

  it("returns deterministic structured review output for this slice", () => {
    const review = computeStructuredAccountReview(
      createAccount(),
      {
        status: "unavailable",
        source: "empty",
        reason: "AI interpretation unavailable because all note fields are empty.",
        normalizedNoteText: null,
      },
      new Date("2026-03-21T00:00:00.000Z"),
    );

    expect(review).toEqual({
      states: [
        {
          key: "serviceFailure",
          label: "Service Failure",
          score: 50,
          confidence: 67,
          status: "available",
        },
        {
          key: "lowAdoption",
          label: "Low Adoption",
          score: 80,
          confidence: 100,
          status: "available",
        },
        {
          key: "usageDecline",
          label: "Usage Decline",
          score: 75,
          confidence: 100,
          status: "available",
        },
        {
          key: "relationshipRisk",
          label: "Relationship Risk",
          score: null,
          confidence: null,
          status: "unavailable",
          reason: "AI interpretation unavailable because all note fields are empty.",
        },
        {
          key: "expansionOpportunity",
          label: "Expansion Opportunity",
          score: null,
          confidence: null,
          status: "unavailable",
          reason: "AI interpretation unavailable because all note fields are empty.",
        },
        {
          key: "lowNps",
          label: "Low NPS",
          score: 60,
          confidence: 100,
          status: "available",
        },
      ],
      renewal: {
        renewalDate: "2026-04-15",
        daysToRenewal: 25,
        renewalScore: 100,
      },
      pipelinePotential: 40000,
      expansionConfidenceScore: null,
      expansionConfidenceBand: null,
    });
  });
});
