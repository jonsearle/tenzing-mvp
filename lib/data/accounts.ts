import { cache } from "react";
import { readFile } from "node:fs/promises";
import path from "node:path";

import { parse } from "csv-parse/sync";

import type { NormalizedAccountRecord, PortfolioAccountSummary } from "@/types/account";
import { normalizeAccountRecord } from "@/lib/data/normalize-account";

const DATASET_PATH = path.join(
  process.cwd(),
  "docs",
  "account_prioritisation_challenge_data.csv",
);

type CsvRow = Record<string, string>;

const loadAccounts = cache(async (): Promise<NormalizedAccountRecord[]> => {
  const file = await readFile(DATASET_PATH, "utf8");
  const rows = parse(file, {
    columns: true,
    skip_empty_lines: true,
    trim: false,
  }) as CsvRow[];

  return rows
    .map((row, index) => normalizeAccountRecord(row, index + 2))
    .filter((row): row is NormalizedAccountRecord => row !== null);
});

export async function getPortfolioSnapshot() {
  const accounts = await loadAccounts();
  const now = new Date();
  const today = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
  );

  const summaries: PortfolioAccountSummary[] = accounts.map((account) => ({
    account_id: account.account_id,
    account_name: account.account_name ?? account.account_id,
    arr_gbp: account.arr_gbp,
    renewal_date: account.renewal_date,
    note_fields_present: [
      account.recent_customer_note,
      account.recent_sales_note,
      account.recent_support_summary,
    ].filter(Boolean).length,
  }));

  return {
    totalAccounts: accounts.length,
    renewingSoon: accounts.filter((account) => {
      if (!account.renewal_date) {
        return false;
      }

      const renewal = Date.parse(`${account.renewal_date}T00:00:00.000Z`);
      const diff = Math.max(0, Math.round((renewal - today) / 86_400_000));
      return diff <= 90;
    }).length,
    accountsWithCoercionFallbacks: accounts.filter(
      (account) => Object.keys(account.coercion_failures).length > 0,
    ).length,
    accounts: summaries,
  };
}

export async function findAccountById(accountId: string) {
  const accounts = await loadAccounts();
  return accounts.find((account) => account.account_id === accountId) ?? null;
}

export async function getAllAccounts() {
  return loadAccounts();
}
