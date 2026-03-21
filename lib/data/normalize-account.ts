import type { CsvInputRow, NormalizedAccountRecord } from "@/types/account";

const STRING_FIELDS = [
  "account_id",
  "external_account_ref",
  "account_name",
  "website",
  "industry",
  "segment",
  "region",
  "account_status",
  "lifecycle_stage",
  "account_owner",
  "csm_owner",
  "support_tier",
  "billing_frequency",
  "billing_currency",
  "note_sentiment_hint",
  "recent_support_summary",
  "recent_customer_note",
  "recent_sales_note",
] as const;

const NUMBER_FIELDS = [
  "arr_gbp",
  "seats_purchased",
  "seats_used",
  "latest_nps",
  "open_leads_count",
  "avg_lead_score",
  "open_tickets_count",
  "urgent_open_tickets_count",
  "sla_breaches_90d",
  "avg_csat_90d",
  "mrr_3m_ago_gbp",
  "mrr_current_gbp",
  "usage_score_3m_ago",
  "usage_score_current",
  "overdue_amount_gbp",
  "expansion_pipeline_gbp",
  "contraction_risk_gbp",
] as const;

const DATE_FIELDS = [
  "contract_start_date",
  "renewal_date",
  "last_lead_activity_date",
  "last_qbr_date",
  "latest_note_date",
] as const;

type StringField = (typeof STRING_FIELDS)[number];
type NumberField = (typeof NUMBER_FIELDS)[number];
type DateField = (typeof DATE_FIELDS)[number];

function normalizeText(raw: string | undefined) {
  const trimmed = raw?.trim() ?? "";
  return trimmed === "" ? null : trimmed;
}

function normalizeNumber(raw: string | undefined) {
  const text = normalizeText(raw);

  if (text === null) {
    return { value: null, failedSource: null };
  }

  const value = Number(text);

  if (Number.isFinite(value)) {
    return { value, failedSource: null };
  }

  return { value: null, failedSource: text };
}

function normalizeDate(raw: string | undefined) {
  const text = normalizeText(raw);

  if (text === null) {
    return { value: null, failedSource: null };
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);

  if (!match) {
    return { value: null, failedSource: text };
  }

  const [, yearText, monthText, dayText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const parsed = new Date(Date.UTC(year, month - 1, day));

  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    return { value: null, failedSource: text };
  }

  return { value: text, failedSource: null };
}

export function normalizeAccountRecord(
  raw: CsvInputRow,
  rowNumber: number,
): NormalizedAccountRecord | null {
  const accountId = normalizeText(raw.account_id);

  if (!accountId) {
    return null;
  }

  const normalized: Partial<NormalizedAccountRecord> = {
    account_id: accountId,
    coercion_failures: {},
    row_number: rowNumber,
  };

  STRING_FIELDS.forEach((field) => {
    normalized[field] = normalizeText(raw[field]) as never;
  });

  NUMBER_FIELDS.forEach((field) => {
    const result = normalizeNumber(raw[field]);
    normalized[field] = result.value as never;

    if (result.failedSource) {
      normalized.coercion_failures![field] = result.failedSource;
    }
  });

  DATE_FIELDS.forEach((field) => {
    const result = normalizeDate(raw[field]);
    normalized[field] = result.value as never;

    if (result.failedSource) {
      normalized.coercion_failures![field] = result.failedSource;
    }
  });

  return normalized as NormalizedAccountRecord;
}

