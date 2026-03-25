import Link from "next/link";

import { ReviewerHeader } from "@/components/reviewer-header";
import { getOptionalUser } from "@/lib/auth/session";

export default async function RankingMethodologyPage() {
  const user = await getOptionalUser();
  const homeHref = user ? "/portfolio-v2" : "/auth/login";

  return (
    <main className="portfolioV2Page writeUpPage">
      <div className="portfolioV2Shell">
        <ReviewerHeader homeHref={homeHref} showSignOut={Boolean(user)} />

        <section className="portfolioV2Section portfolioV2Section--tightTop">
          <div className="writeUpHero">
            <h1>Account Prioritisation — Overview &amp; Strategy</h1>
            <div className="writeUpHeroActions">
              <Link className="portfolioV2ActionLink" href="/write-up">
                Back to write-up
              </Link>
              <Link className="portfolioV2SectionLink" href={homeHref}>
                {user ? "Back to portfolio" : "Back to login"}
              </Link>
            </div>
          </div>
        </section>

        <section className="portfolioV2Section writeUpSection">
          <h2>Overview</h2>
          <p>The system creates two separate rankings for the same portfolio:</p>
          <ul className="writeUpList">
            <li>
              <strong>Risk ranking</strong>: prioritises accounts most likely to
              need intervention to protect revenue
            </li>
            <li>
              <strong>Growth ranking</strong>: prioritises accounts with the
              strongest expansion potential
            </li>
          </ul>
          <p>
            Each account is scored from specific CSV inputs. Those inputs are
            used to calculate a small set of diagnostic states, and those
            states are then combined into a final score for each ranking.
          </p>
        </section>

        <section className="portfolioV2Section writeUpSection">
          <h2>Diagnostic States</h2>
          <p>The diagnostic states are calculated from the CSV as follows:</p>
          <ul className="writeUpList">
            <li>
              <strong>Service failure</strong> uses{" "}
              <code>open_tickets_count</code>,{" "}
              <code>urgent_open_tickets_count</code>, and{" "}
              <code>sla_breaches_90d</code>
            </li>
            <li>
              <strong>Low adoption</strong> uses <code>seats_purchased</code>{" "}
              and <code>seats_used</code>
            </li>
            <li>
              <strong>Usage decline</strong> uses{" "}
              <code>usage_score_current</code> and{" "}
              <code>usage_score_3m_ago</code>
            </li>
            <li>
              <strong>Low NPS</strong> uses <code>latest_nps</code>
            </li>
            <li>
              <strong>Expansion opportunity</strong> uses{" "}
              <code>expansion_pipeline_gbp</code>, with{" "}
              <code>recent_customer_note</code> and{" "}
              <code>recent_sales_note</code> used as a light AI modifier
            </li>
          </ul>
          <p>These inputs are weighted within each state as follows:</p>
          <ul className="writeUpList">
            <li>
              <strong>Service failure</strong> = 25% open tickets + 40% urgent
              open tickets + 35% SLA breaches
            </li>
            <li>
              <strong>Low adoption</strong> = 100% seat utilisation gap
            </li>
            <li>
              <strong>Usage decline</strong> = 100% change in usage over 3
              months
            </li>
            <li>
              <strong>Low NPS</strong> = 100% NPS shortfall below benchmark
            </li>
            <li>
              <strong>Expansion opportunity</strong> = 90% expansion pipeline +
              10% AI-interpreted growth sentiment
            </li>
          </ul>
          <p>
            Each state is normalised to a common scale and adjusted for data
            completeness before ranking.
          </p>
        </section>

        <section className="portfolioV2Section writeUpSection">
          <h2>Risk Ranking</h2>
          <p>The risk ranking is built from four diagnostic states:</p>
          <ul className="writeUpList">
            <li>
              <code>service_failure</code>
            </li>
            <li>
              <code>usage_decline</code>
            </li>
            <li>
              <code>low_adoption</code>
            </li>
            <li>
              <code>low_nps</code>
            </li>
          </ul>
          <p>
            <strong>Risk severity</strong> = 1.0 service failure + 1.0 usage
            decline + 0.9 low adoption + 0.8 low NPS
          </p>
          <p>
            <strong>Final risk priority</strong> = 60% risk severity + 25%
            commercial importance, using <code>arr</code> + 15% renewal
            urgency, using <code>renewal_date</code>
          </p>
        </section>

        <section className="portfolioV2Section writeUpSection">
          <h2>Growth Ranking</h2>
          <p>
            <strong>Final growth priority</strong> = 65% expansion opportunity
            + 35% commercial importance, using <code>arr</code>
          </p>
        </section>

        <section className="portfolioV2Section writeUpSection">
          <h2>Ranking Output</h2>
          <p>
            Once each account has a final <strong>risk priority</strong> and{" "}
            <strong>growth priority</strong>, accounts are ranked separately in
            each view. If scores are tied, ties are broken using the underlying
            diagnostic score, then commercial importance, then account ID.
          </p>
          <p>
            For presentation, each diagnostic state score is also converted
            from its underlying 0-100 score into a simpler{" "}
            <strong>1-5 user-facing scale</strong>, so the output is easier to
            read without changing the underlying ranking logic.
          </p>
        </section>
      </div>
    </main>
  );
}
