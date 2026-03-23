import Link from "next/link";

import { ReviewerHeader } from "@/components/reviewer-header";
import { getOptionalUser } from "@/lib/auth/session";

export default async function WriteUpPage() {
  const user = await getOptionalUser();
  const homeHref = user ? "/portfolio-v2" : "/auth/login";

  return (
    <main className="portfolioV2Page writeUpPage">
      <div className="portfolioV2Shell">
        <ReviewerHeader homeHref={homeHref} showSignOut={Boolean(user)} />

        <section className="portfolioV2Section portfolioV2Section--tightTop">
          <div className="writeUpHero">
            <p className="writeUpEyebrow">Submission write-up</p>
            <h1>AI-Powered Account Prioritisation Tool</h1>
            <p className="writeUpLead">
              This prototype is built to help leadership decide which accounts
              need attention, understand why, and know what should happen next.
            </p>
            <div className="writeUpHeroActions">
              <Link className="portfolioV2ActionLink" href={homeHref}>
                {user ? "Back to portfolio" : "Back to login"}
              </Link>
              <Link className="portfolioV2SectionLink" href="/ranking-methodology">
                View ranking methodology
              </Link>
            </div>
          </div>
        </section>

        <section className="portfolioV2Section writeUpSection">
          <h2>Mission and Vision</h2>
          <p>
            The broader mission behind this product is to help businesses grow
            through data and the use of AI.
          </p>
          <p>The long-term vision is a continuously learning decision system that:</p>
          <ul className="writeUpList">
            <li>Suggests the most effective action</li>
            <li>Measures the outcomes of those actions</li>
            <li>Improves its recommendations over time</li>
          </ul>
        </section>

        <section className="portfolioV2Section writeUpSection">
          <h2>Architecture Decisions</h2>
          <p>
            <strong>Data Layer</strong>
          </p>
          <ul className="writeUpList">
            <li>The provided CSV remains the core data source</li>
          </ul>
          <p>
            <strong>Normalisation Layer</strong>
          </p>
          <p>Handles:</p>
          <ul className="writeUpList">
            <li>Null values</li>
            <li>Mixed data types</li>
            <li>Imperfect inputs</li>
          </ul>
          <p>While:</p>
          <ul className="writeUpList">
            <li>Preserving invalid inputs for transparency</li>
          </ul>
          <p>
            <strong>Scoring Layer</strong>
          </p>
          <ul className="writeUpList">
            <li>Deterministic scoring drives prioritisation</li>
            <li>Ranking logic remains inspectable and defensible</li>
          </ul>
          <p>
            <strong>AI Layer</strong>
          </p>
          <p>AI (Artificial Intelligence) is used to:</p>
          <ul className="writeUpList">
            <li>Interpret notes</li>
            <li>Explain mixed-signal accounts</li>
          </ul>
          <p>AI does not:</p>
          <ul className="writeUpList">
            <li>Rank accounts end-to-end</li>
          </ul>
          <p>
            <strong>Application Layer</strong>
          </p>
          <p>Supabase is used for:</p>
          <ul className="writeUpList">
            <li>Google authentication</li>
            <li>Cached AI interpretations</li>
            <li>Saved decisions</li>
          </ul>
        </section>

        <section className="portfolioV2Section writeUpSection">
          <h2>How Prioritisation Works</h2>
          <p>This system ranks accounts through two distinct views:</p>
          <p>
            <strong>Risk View (Revenue Protection)</strong>
          </p>
          <p>Surfaces:</p>
          <ul className="writeUpList">
            <li>Accounts most likely to churn</li>
            <li>Accounts at risk of contraction</li>
          </ul>
          <p>
            <strong>Growth View (Revenue Expansion)</strong>
          </p>
          <p>Surfaces:</p>
          <ul className="writeUpList">
            <li>Accounts with the strongest expansion potential</li>
          </ul>
          <p>
            <strong>Why Two Views?</strong>
          </p>
          <p>Different teams optimise for different outcomes:</p>
          <ul className="writeUpList">
            <li>Customer Success -&gt; retention</li>
            <li>Support -&gt; stability</li>
            <li>Sales -&gt; growth</li>
          </ul>
          <p>A single prioritisation would blur these objectives.</p>
          <p>
            <strong>How Ranking Works (Conceptual)</strong>
          </p>
          <p>Accounts are prioritised based on:</p>
          <ul className="writeUpList">
            <li>Commercial impact (ARR, expansion value)</li>
            <li>Urgency (e.g. renewal timing)</li>
            <li>Signal strength (consistency of evidence)</li>
            <li>Direction of value (risk vs growth)</li>
          </ul>
          <p>
            In simple terms:
          </p>
          <p>
            Accounts rise in priority when meaningful value is at stake, timing
            is urgent, and multiple signals point in the same direction.
          </p>
          <p>
            Detailed formulas are documented separately in the{" "}
            <Link className="writeUpInlineLink" href="/ranking-methodology">
              full ranking methodology
            </Link>
            .
          </p>
        </section>

        <section className="portfolioV2Section writeUpSection">
          <h2>How AI Improves the Workflow</h2>
          <p>
            AI is used to improve interpretation where rules alone are
            insufficient.
          </p>
          <p>
            <strong>Problem</strong>
          </p>
          <p>
            Structured metrics explain what is happening, but not always why,
            especially when:
          </p>
          <ul className="writeUpList">
            <li>Notes are messy</li>
            <li>Signals conflict</li>
            <li>Context is unclear</li>
          </ul>
          <p>
            <strong>Approach</strong>
          </p>
          <p>
            Instead of sending raw notes, the system sends a structured account
            brief to the model, including:
          </p>
          <ul className="writeUpList">
            <li>Renewal urgency</li>
            <li>Adoption level</li>
            <li>Usage trend</li>
            <li>Service pressure</li>
            <li>Pipeline position</li>
            <li>Data gaps</li>
          </ul>
          <p>
            <strong>Output</strong>
          </p>
          <p>The model returns:</p>
          <ul className="writeUpList">
            <li>A concise account summary</li>
            <li>The primary driver</li>
            <li>Identification of mixed signals</li>
            <li>
              Bounded signals (e.g. relationship sentiment, growth sentiment)
            </li>
          </ul>
          <p>
            <strong>Role of AI</strong>
          </p>
          <p>AI improves:</p>
          <ul className="writeUpList">
            <li>Interpretation</li>
            <li>Explanation quality</li>
            <li>Action framing</li>
          </ul>
          <p>AI does not:</p>
          <ul className="writeUpList">
            <li>Decide priority</li>
          </ul>
        </section>

        <section className="portfolioV2Section writeUpSection">
          <h2>Trade-offs</h2>
          <p>
            <strong>1. Simplicity vs Sophistication</strong>
          </p>
          <ul className="writeUpList">
            <li>Chose deterministic, formula-driven scoring</li>
            <li>Easier to explain and defend</li>
          </ul>
          <p>
            <strong>2. AI Scope</strong>
          </p>
          <ul className="writeUpList">
            <li>AI is bounded to interpretation and explanation</li>
            <li>Avoids black-box ranking</li>
          </ul>
          <p>
            <strong>3. Prototype Constraints</strong>
          </p>
          <ul className="writeUpList">
            <li>CSV used as source of truth</li>
            <li>Fast to build and inspect</li>
            <li>Limited by data breadth and freshness</li>
          </ul>
          <p>
            <strong>4. Data Quality Handling</strong>
          </p>
          <ul className="writeUpList">
            <li>Nulls and inconsistencies handled explicitly</li>
            <li>No full production-grade pipelines</li>
          </ul>
          <p>
            <strong>5. Evidence Quality</strong>
          </p>
          <p>Current system:</p>
          <ul className="writeUpList">
            <li>Treats presence of notes as usable evidence</li>
          </ul>
          <p>Future system should:</p>
          <ul className="writeUpList">
            <li>Assess note quality</li>
            <li>Consider recency</li>
            <li>Evaluate consistency across sources</li>
          </ul>
        </section>

        <section className="portfolioV2Section writeUpSection">
          <h2>What I Would Build Next</h2>
          <p>
            <strong>1. Move from Account Prioritisation -&gt; Strategic Insight</strong>
          </p>
          <p>
            <strong>Goal</strong>
          </p>
          <p>
            Shift from reacting to individual accounts -&gt; identifying leading
            indicators across the portfolio.
          </p>
          <p>
            <strong>Why this matters</strong>
          </p>
          <ul className="writeUpList">
            <li>
              Leadership benefits from account-level prioritisation, but gains
              even more value when patterns can also be seen across the
              portfolio
            </li>
            <li>Systemic issues and opportunities drive larger impact</li>
          </ul>
          <p>
            <strong>What this enables</strong>
          </p>
          <ul className="writeUpList">
            <li>Earlier detection of churn risk</li>
            <li>Earlier identification of expansion opportunities</li>
            <li>Portfolio-level decision-making</li>
          </ul>
        </section>
      </div>
    </main>
  );
}
