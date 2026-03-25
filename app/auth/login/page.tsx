import Link from "next/link";

import { PendingSubmitButton } from "@/components/pending-submit-button";
import { ReviewerHeader } from "@/components/reviewer-header";
import { getOptionalUser } from "@/lib/auth/session";
import { hasSupabaseEnv } from "@/lib/supabase/config";

export default async function LoginPage() {
  const user = await getOptionalUser();

  if (user) {
    return (
      <main className="portfolioV2Page authPage">
        <div className="portfolioV2Shell authShell">
          <ReviewerHeader homeHref="/portfolio-v2" logoHref="/portfolio-v2" />

          <section className="authHero authHero--signedIn">
            <div className="authHeroMain">
              <p className="authEyebrow">Authenticated</p>
              <h1>Already in.</h1>
              <p className="authLead">
                Your session is live and ready to open the ranked portfolio.
              </p>
            </div>
            <div className="authActions">
              <Link className="portfolioV2ActionLink authPrimaryAction" href="/portfolio-v2">
                Open portfolio
              </Link>
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="portfolioV2Page authPage">
      <div className="portfolioV2Shell authShell">
        <ReviewerHeader
          homeHref="/auth/login"
          logoHref="/auth/login"
          rightSlot={(
            <div className="authHeaderMeta">
              <span className={`authStatusPill ${hasSupabaseEnv() ? "is-ready" : "is-warning"}`}>
                {hasSupabaseEnv() ? "Google auth ready" : "Env setup required"}
              </span>
            </div>
          )}
        />

        <section className="authHero">
          <div className="authHeroMain">
            <p className="authEyebrow">Portfolio access</p>
            <h1>Account Prioritisation Tool</h1>
            <p className="authLead">
              Made by Jon Searle (and Ai)
            </p>
            <div className="authActions">
              <a className="portfolioV2ActionLink authPrimaryAction" href="/auth/sign-in">
                Sign in with Google
              </a>
              <form action="/auth/skip" method="post">
                <PendingSubmitButton
                  className="portfolioV2SectionLink authSecondaryAction"
                  idleLabel="Skip authentication"
                  pendingLabel="Opening portfolio..."
                />
              </form>
            </div>
          </div>

        </section>
      </div>
    </main>
  );
}
