import { normalizeAccountRecord } from "@/lib/data/normalize-account";

describe("normalizeAccountRecord", () => {
  it("trims strings, converts empty values to null, and coerces numbers and dates", () => {
    const account = normalizeAccountRecord(
      {
        account_id: " ACC-999 ",
        account_name: " Sample Account ",
        renewal_date: "2026-08-12",
        arr_gbp: " 12345.67 ",
        seats_purchased: "",
        recent_customer_note: "  ",
      },
      2,
    );

    expect(account).not.toBeNull();
    expect(account?.account_id).toBe("ACC-999");
    expect(account?.account_name).toBe("Sample Account");
    expect(account?.renewal_date).toBe("2026-08-12");
    expect(account?.arr_gbp).toBe(12345.67);
    expect(account?.seats_purchased).toBeNull();
    expect(account?.recent_customer_note).toBeNull();
  });

  it("preserves invalid source values as coercion fallbacks while treating fields as missing", () => {
    const account = normalizeAccountRecord(
      {
        account_id: "ACC-888",
        latest_nps: "bad-score",
        renewal_date: "12/08/2026",
      },
      4,
    );

    expect(account).not.toBeNull();
    expect(account?.latest_nps).toBeNull();
    expect(account?.renewal_date).toBeNull();
    expect(account?.coercion_failures.latest_nps).toBe("bad-score");
    expect(account?.coercion_failures.renewal_date).toBe("12/08/2026");
  });

  it("drops rows without a canonical account identifier", () => {
    const account = normalizeAccountRecord(
      {
        account_id: "   ",
        account_name: "Should not load",
      },
      8,
    );

    expect(account).toBeNull();
  });
});
