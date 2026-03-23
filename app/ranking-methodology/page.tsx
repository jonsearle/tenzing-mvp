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
          <p>The system provides <strong>two distinct views of the same portfolio</strong>:</p>
          <ul className="writeUpList">
            <li>
              <strong>Risk view</strong> {"->"} prioritises revenue protection (Customer
              Success / Support)
            </li>
            <li>
              <strong>Growth view</strong> {"->"} prioritises expansion (Sales / Account
              Management)
            </li>
          </ul>
          <p>
            These views reflect different commercial objectives and teams, so
            accounts are ranked separately within each.
          </p>
          <p>Within each view, accounts are ranked by <strong>priority</strong>, derived from:</p>
          <ol className="writeUpList">
            <li>
              <strong>Diagnostic states</strong> (what is happening)
            </li>
            <li>
              <strong>Commercial importance</strong> (how much value is at stake)
            </li>
            <li>
              <strong>Urgency</strong> <em>(risk only)</em> (how soon action is required)
            </li>
          </ol>
        </section>

        <section className="portfolioV2Section writeUpSection">
          <h2>Core Ranking Logic</h2>
          <ul className="writeUpList">
            <li>
              Each account is assigned a set of <strong>states</strong> (e.g.
              service failure, usage decline, expansion opportunity)
            </li>
            <li>States are:</li>
          </ul>
          <ul className="writeUpList">
            <li>
              <strong>Deterministic</strong> (derived directly from CSV inputs)
            </li>
            <li>
              <strong>Normalised and weighted</strong>
            </li>
            <li>
              <strong>Adjusted for data completeness</strong> to avoid false
              precision
            </li>
          </ul>
          <ul className="writeUpList">
            <li>States are combined into:</li>
          </ul>
          <ul className="writeUpList">
            <li>
              <strong>Risk severity score</strong> <em>(risk view)</em>
            </li>
            <li>
              <strong>Opportunity score</strong> <em>(growth view)</em>
            </li>
          </ul>
          <ul className="writeUpList">
            <li>These are then combined with:</li>
          </ul>
          <ul className="writeUpList">
            <li>
              <strong>Commercial importance (ARR + pipeline)</strong>
            </li>
            <li>
              <strong>Renewal urgency (risk only)</strong>
            </li>
          </ul>
          <p>
            This produces a final <strong>priority score</strong>, which
            determines ranking.
          </p>
        </section>

        <section className="portfolioV2Section writeUpSection">
          <h2>Key Design Principles</h2>
          <ul className="writeUpList">
            <li>
              <strong>Diagnosis is separated from importance</strong> {"->"} avoids
              large accounts always dominating
            </li>
            <li>
              <strong>Risk and growth are split</strong> {"->"} prevents
              conflicting signals from cancelling each other out
            </li>
            <li>
              <strong>AI informs signals, not ranking</strong> {"->"} keeps
              prioritisation explainable and defensible
            </li>
          </ul>
        </section>

        <section className="portfolioV2Section writeUpSection">
          <h2>Inputs Used</h2>
          <p>
            The ranking model starts from the provided CSV. Structured fields
            are normalised into typed account records, and note fields are
            interpreted separately via AI.
          </p>
          <p>
            <strong>Structured inputs include:</strong>
          </p>
          <ul className="writeUpList">
            <li>ARR</li>
            <li>Renewal date</li>
            <li>Seats purchased / used</li>
            <li>Usage trend</li>
            <li>Tickets</li>
            <li>SLA breaches</li>
            <li>NPS</li>
            <li>Expansion pipeline</li>
          </ul>
        </section>

        <section className="portfolioV2Section writeUpSection">
          <h2>Diagnostic State Formulas</h2>
          <p>
            Each diagnostic state is computed on a raw <code>0–1</code> scale
            and adjusted by a <strong>completeness score</strong>:
          </p>
          <pre className="writeUpCode">
{`completeness = populated required fields / total required fields`}
          </pre>

          <h3 className="writeUpSubheading">Service Failure</h3>
          <pre className="writeUpCode">
{`strength =
  0.25 * min(open_tickets_count / 10, 1)
+ 0.40 * min(urgent_open_tickets_count / 5, 1)
+ 0.35 * min(sla_breaches_90d / 5, 1)

if urgent_open_tickets_count >= 4 or sla_breaches_90d >= 4:
  strength = max(strength, 0.75)

service_failure = clamp(strength, 0, 1) * completeness`}
          </pre>

          <h3 className="writeUpSubheading">Low Adoption</h3>
          <pre className="writeUpCode">
{`seat_utilisation = seats_used / seats_purchased
strength = 1 - clamp(seat_utilisation, 0, 1)

if seat_utilisation <= 0.25:
  strength = max(strength, 0.75)

low_adoption = clamp(strength, 0, 1) * completeness`}
          </pre>

          <h3 className="writeUpSubheading">Usage Decline</h3>
          <pre className="writeUpCode">
{`decline = usage_score_3m_ago - usage_score_current
strength = clamp(decline / 40, 0, 1)

if decline >= 25:
  strength = max(strength, 0.75)

usage_decline = strength * completeness`}
          </pre>

          <h3 className="writeUpSubheading">Low NPS</h3>
          <pre className="writeUpCode">
{`strength = clamp((50 - latest_nps) / 100, 0, 1)
low_nps = strength * completeness`}
          </pre>

          <h3 className="writeUpSubheading">Expansion Opportunity (AI-assisted)</h3>
          <pre className="writeUpCode">
{`pipeline_norm =
  expansion_pipeline_gbp === null
    ? 0
    : min(expansion_pipeline_gbp / 50000, 1)

expansion_confidence =
  positive growth vibe -> 1
  neutral growth vibe -> 0.5
  negative growth vibe -> 0

strength = clamp(0.9 * pipeline_norm + 0.1 * expansion_confidence, 0, 1)

expansion_opportunity = strength * completeness(
  expansion_pipeline_gbp,
  recent_customer_note,
  recent_sales_note
)

If AI interpretation is unavailable:
  expansion_opportunity is unavailable`}
          </pre>
          <p>
            In the current model, expansion pipeline drives most of the growth
            signal. AI-derived growth sentiment is used only as a light
            modifier, not as a co-equal ranking input.
          </p>
        </section>

        <section className="portfolioV2Section writeUpSection">
          <h2>Renewal Scoring (Risk Only)</h2>
          <p>
            Renewal is treated as an <strong>urgency modifier</strong>, not a
            diagnostic state.
          </p>
          <pre className="writeUpCode">
{`days_to_renewal = max(0, renewal_date - today)

renewal_score =
  100 if days_to_renewal <= 30
   75 if days_to_renewal <= 60
   50 if days_to_renewal <= 120
   25 if days_to_renewal <= 180
    0 otherwise

If renewal date is missing:
  renewal_score = 0`}
          </pre>
        </section>

        <section className="portfolioV2Section writeUpSection">
          <h2>Risk Ranking Formula</h2>
          <p>Only these states contribute to risk severity:</p>
          <ul className="writeUpList">
            <li>Service failure</li>
            <li>Usage decline</li>
            <li>Low adoption</li>
            <li>Low NPS</li>
          </ul>
          <pre className="writeUpCode">
{`risk_severity =
  (
    service_failure
    + usage_decline
    + 0.9 * low_adoption
    + 0.8 * low_nps
  ) / 3.7

risk_priority =
  0.60 * (risk_severity * 100)
  + 0.25 * arr_potential_score
  + 0.15 * renewal_score`}
          </pre>
          <p>
            <strong>Note:</strong>
          </p>
          <ul className="writeUpList">
            <li>
              Relationship risk informs reasoning but is not included in
              ranking (current implementation)
            </li>
          </ul>
        </section>

        <section className="portfolioV2Section writeUpSection">
          <h2>Growth Ranking Formula</h2>
          <pre className="writeUpCode">
{`growth_priority =
  0.65 * (expansion_opportunity * 100)
  + 0.35 * growth_score`}
          </pre>
          <ul className="writeUpList">
            <li>
              Combines <strong>expansion opportunity</strong> and{" "}
              <strong>commercial importance</strong>
            </li>
            <li>
              Renewal urgency does <strong>not</strong> affect growth ranking
            </li>
          </ul>
        </section>

        <section className="portfolioV2Section writeUpSection">
          <h2>Tie-Break Rules</h2>
          <h3 className="writeUpSubheading">Risk Queue</h3>
          <ol className="writeUpList">
            <li>Higher risk priority</li>
            <li>Higher risk severity</li>
            <li>Higher ARR percentile score</li>
            <li>Alphabetical account ID</li>
          </ol>

          <h3 className="writeUpSubheading">Growth Queue</h3>
          <ol className="writeUpList">
            <li>Higher growth priority</li>
            <li>Higher expansion opportunity</li>
            <li>Higher growth importance percentile score</li>
            <li>Alphabetical account ID</li>
          </ol>
        </section>

        <section className="portfolioV2Section writeUpSection">
          <h2>Recommendation Logic</h2>
          <p>
            When viewing an account, the system selects a{" "}
            <strong>default next action</strong> based on the highest scoring
            state.
          </p>
          <pre className="writeUpCode">
{`If no state score is above 0:
  no default action

If exactly one state has the highest non-zero score:
  map that state to a default recommended action

If multiple states tie for highest score:
  no default action`}
          </pre>
        </section>

        <section className="portfolioV2Section writeUpSection">
          <h2>Summary (for clarity)</h2>
          <ul className="writeUpList">
            <li>
              <strong>States diagnose the problem</strong>
            </li>
            <li>
              <strong>Importance scales the impact</strong>
            </li>
            <li>
              <strong>Urgency prioritises timing (risk only)</strong>
            </li>
            <li>
              <strong>AI enriches signals but does not control ranking</strong>
            </li>
            <li>
              <strong>Final output = ranked accounts + recommended action</strong>
            </li>
          </ul>
        </section>
      </div>
    </main>
  );
}
