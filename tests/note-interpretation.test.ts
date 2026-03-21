import {
  buildNormalizedNoteInterpretationInput,
  getAccountNoteInterpretation,
  requestNoteInterpretationFromOpenAI,
} from "@/lib/notes/interpretation";
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
    note_sentiment_hint: "ignore me",
    recent_support_summary: "Support reports several escalations.",
    recent_customer_note: " Customer says trust is low. ",
    recent_sales_note: "Sales sees room to expand.",
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

describe("note interpretation", () => {
  const originalApiKey = process.env.OPENAI_API_KEY;
  const originalModel = process.env.OPENAI_MODEL;

  afterEach(() => {
    process.env.OPENAI_API_KEY = originalApiKey;
    process.env.OPENAI_MODEL = originalModel;
    vi.restoreAllMocks();
  });

  it("normalizes only the locked note fields into a lowercase cache key", () => {
    expect(buildNormalizedNoteInterpretationInput(createAccount())).toBe(
      [
        "customer says trust is low.",
        "sales sees room to expand.",
        "support reports several escalations.",
      ].join("\n\n"),
    );
  });

  it("returns unavailable and skips cache/model work when all notes are empty", async () => {
    const loadCachedInterpretation = vi.fn();
    const saveCachedInterpretation = vi.fn();
    const requestInterpretation = vi.fn();

    const result = await getAccountNoteInterpretation(
      createAccount({
        recent_customer_note: " ",
        recent_sales_note: null,
        recent_support_summary: "",
      }),
      {
        loadCachedInterpretation,
        saveCachedInterpretation,
        requestInterpretation,
      },
    );

    expect(result).toEqual({
      status: "unavailable",
      source: "empty",
      reason: "AI interpretation unavailable because all note fields are empty.",
      normalizedNoteText: null,
    });
    expect(loadCachedInterpretation).not.toHaveBeenCalled();
    expect(saveCachedInterpretation).not.toHaveBeenCalled();
    expect(requestInterpretation).not.toHaveBeenCalled();
  });

  it("reuses a successful cached interpretation when the normalized notes are unchanged", async () => {
    const loadCachedInterpretation = vi.fn().mockResolvedValue({
      accountId: "ACC-123",
      normalizedNoteText: [
        "customer says trust is low.",
        "sales sees room to expand.",
        "support reports several escalations.",
      ].join("\n\n"),
      overallSummary: "Cached summary",
      relationshipVibe: "negative",
      growthVibe: "positive",
      createdAt: null,
      updatedAt: null,
    });
    const saveCachedInterpretation = vi.fn();
    const requestInterpretation = vi.fn();

    const result = await getAccountNoteInterpretation(createAccount(), {
      loadCachedInterpretation,
      saveCachedInterpretation,
      requestInterpretation,
    });

    expect(result).toMatchObject({
      status: "available",
      source: "cache",
    });
    expect(requestInterpretation).not.toHaveBeenCalled();
    expect(saveCachedInterpretation).not.toHaveBeenCalled();
  });

  it("invalidates cache and stores a fresh result when the normalized notes change", async () => {
    const loadCachedInterpretation = vi.fn().mockResolvedValue({
      accountId: "ACC-123",
      normalizedNoteText: "older note text",
      overallSummary: "Old summary",
      relationshipVibe: "neutral",
      growthVibe: "neutral",
      createdAt: null,
      updatedAt: null,
    });
    const requestInterpretation = vi.fn().mockResolvedValue({
      overallSummary: "Fresh summary",
      relationshipVibe: "negative",
      growthVibe: "positive",
    });
    const saveCachedInterpretation = vi.fn().mockResolvedValue(undefined);

    const result = await getAccountNoteInterpretation(createAccount(), {
      loadCachedInterpretation,
      saveCachedInterpretation,
      requestInterpretation,
    });

    expect(result).toMatchObject({
      status: "available",
      source: "live",
      interpretation: {
        overallSummary: "Fresh summary",
        relationshipVibe: "negative",
        growthVibe: "positive",
      },
    });
    expect(requestInterpretation).toHaveBeenCalledWith(
      [
        "customer says trust is low.",
        "sales sees room to expand.",
        "support reports several escalations.",
      ].join("\n\n"),
    );
    expect(saveCachedInterpretation).toHaveBeenCalledTimes(1);
  });

  it("does not cache failed or invalid interpretation attempts", async () => {
    const saveCachedInterpretation = vi.fn();

    const result = await getAccountNoteInterpretation(createAccount(), {
      loadCachedInterpretation: vi.fn().mockResolvedValue(null),
      saveCachedInterpretation,
      requestInterpretation: vi.fn().mockRejectedValue(new Error("boom")),
    });

    expect(result).toEqual({
      status: "unavailable",
      source: "error",
      reason: "AI interpretation was unavailable for this view.",
      normalizedNoteText: [
        "customer says trust is low.",
        "sales sees room to expand.",
        "support reports several escalations.",
      ].join("\n\n"),
    });
    expect(saveCachedInterpretation).not.toHaveBeenCalled();
  });

  it("parses the structured OpenAI response and sends only normalized note text", async () => {
    process.env.OPENAI_API_KEY = "test-key";
    process.env.OPENAI_MODEL = "gpt-4o-mini";

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify({
                overall_summary: "A concise summary.",
                relationship_vibe: "negative",
                growth_vibe: "neutral",
              }),
            },
          },
        ],
      }),
    });

    vi.stubGlobal("fetch", fetchMock);

    const result = await requestNoteInterpretationFromOpenAI(
      "customer says trust is low.\n\nsales sees room to expand.",
    );

    expect(result).toEqual({
      overallSummary: "A concise summary.",
      relationshipVibe: "negative",
      growthVibe: "neutral",
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      "https://api.openai.com/v1/chat/completions",
    );

    const requestInit = fetchMock.mock.calls[0]?.[1];
    const body = JSON.parse(String(requestInit?.body));

    expect(body.messages[1].content).toContain(
      "customer says trust is low.\n\nsales sees room to expand.",
    );
    expect(body.messages[1].content).not.toContain("ignore me");
  });
});
