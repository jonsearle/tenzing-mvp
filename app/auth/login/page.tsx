import Link from "next/link";

import { getOptionalUser } from "@/lib/auth/session";
import { hasSupabaseEnv } from "@/lib/supabase/config";

export default async function LoginPage() {
  const user = await getOptionalUser();

  if (user) {
    return (
      <main className="shell stack">
        <section className="hero stack">
          <span className="eyebrow">Authenticated</span>
          <h1 className="title">You are already signed in.</h1>
          <p className="subtitle">
            Continue to the protected portfolio foundation for the CSV-backed
            account dataset.
          </p>
          <div className="row">
            <Link className="button" href="/portfolio">
              Go to portfolio
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="shell stack">
      <section className="hero stack">
        <span className="eyebrow">JON-6</span>
        <h1 className="title">Google-only access to the account portfolio.</h1>
        <p className="subtitle">
          This slice establishes the authenticated app shell, protects portfolio
          and queue/account routes, and keeps CSV ingestion on the server.
        </p>
        <div className="row">
          <a className="button" href="/auth/sign-in">
            Sign in with Google
          </a>
          <span className="muted">Supabase handles session state for MVP.</span>
        </div>
      </section>

      <section className="panel stack">
        <div className="row-between">
          <div>
            <h2>Environment status</h2>
            <p className="muted">
              The app is ready for Google auth as soon as Supabase public keys
              are configured.
            </p>
          </div>
          <span className={`pill ${hasSupabaseEnv() ? "" : "danger"}`}>
            {hasSupabaseEnv() ? "Supabase configured" : "Set Supabase env vars"}
          </span>
        </div>
        {!hasSupabaseEnv() ? (
          <p className="muted">
            Add `NEXT_PUBLIC_SUPABASE_URL` and
            `NEXT_PUBLIC_SUPABASE_ANON_KEY` to enable the live sign-in flow.
          </p>
        ) : null}
      </section>
    </main>
  );
}

