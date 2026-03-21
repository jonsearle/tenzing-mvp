import Link from "next/link";

import { requireUser } from "@/lib/auth/session";

export default async function QueuePage() {
  await requireUser("/queue");

  return (
    <main className="shell stack">
      <section className="hero stack">
        <span className="eyebrow">Protected queue routes</span>
        <h1 className="title">Queue shell established.</h1>
        <p className="subtitle">
          JON-6 only needs the authenticated boundary for queue routes. Ranking
          logic and queue content arrive in later slices.
        </p>
        <div className="row">
          <Link className="button" href="/queue/risk">
            Risk queue
          </Link>
          <Link className="buttonSecondary" href="/queue/growth">
            Growth queue
          </Link>
        </div>
      </section>
    </main>
  );
}

