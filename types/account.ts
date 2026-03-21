export type CsvInputRow = Record<string, string | undefined>;

type StringField =
  | "account_id"
  | "external_account_ref"
  | "account_name"
  | "website"
  | "industry"
  | "segment"
  | "region"
  | "account_status"
  | "lifecycle_stage"
  | "account_owner"
  | "csm_owner"
  | "support_tier"
  | "billing_frequency"
  | "billing_currency"
  | "note_sentiment_hint"
  | "recent_support_summary"
  | "recent_customer_note"
  | "recent_sales_note";

type NumberField =
  | "arr_gbp"
  | "seats_purchased"
  | "seats_used"
  | "latest_nps"
  | "open_leads_count"
  | "avg_lead_score"
  | "open_tickets_count"
  | "urgent_open_tickets_count"
  | "sla_breaches_90d"
  | "avg_csat_90d"
  | "mrr_3m_ago_gbp"
  | "mrr_current_gbp"
  | "usage_score_3m_ago"
  | "usage_score_current"
  | "overdue_amount_gbp"
  | "expansion_pipeline_gbp"
  | "contraction_risk_gbp";

type DateField =
  | "contract_start_date"
  | "renewal_date"
  | "last_lead_activity_date"
  | "last_qbr_date"
  | "latest_note_date";

export type NormalizedAccountRecord = {
  account_id: string;
  row_number: number;
  coercion_failures: Partial<Record<NumberField | DateField, string>>;
} & Omit<Record<StringField, string | null>, "account_id"> &
  Record<NumberField, number | null> &
  Record<DateField, string | null>;

export type PortfolioAccountSummary = {
  account_id: string;
  account_name: string;
  arr_gbp: number | null;
  renewal_date: string | null;
  note_fields_present: number;
};
