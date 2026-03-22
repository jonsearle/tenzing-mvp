import { readFile } from "node:fs/promises";
import path from "node:path";
import Link from "next/link";

import { requireUser } from "@/lib/auth/session";

const REVIEW_HTML_PATH = path.join(
  process.cwd(),
  "docs",
  "account-ranking-review-2026-03-21-v5.html",
);

export default async function LegacyReviewV5Page() {
  await requireUser("/review/v5");

  const reviewHtml = await readFile(REVIEW_HTML_PATH, "utf8");

  return (
    <main className="shell stack">
      <section className="hero stack">
        <div className="row-between">
          <div className="stack">
            <span className="eyebrow">Legacy review artifact</span>
            <h1 className="title">Account ranking review v5.</h1>
            <p className="subtitle">
              This is the preserved HTML artifact from the earlier review pass,
              shown inside the authenticated app so you can open it remotely
              without making the raw file public.
            </p>
          </div>
          <Link className="buttonSecondary" href="/review">
            Back to review
          </Link>
        </div>
      </section>

      <section className="panel stack">
        <div>
          <h2>Embedded artifact</h2>
          <p className="muted">
            Scroll inside the frame to inspect the full original review table.
          </p>
        </div>
        <iframe
          className="reviewFrame"
          srcDoc={reviewHtml}
          title="Account ranking review v5"
        />
      </section>
    </main>
  );
}
