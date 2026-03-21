const fs = require('fs');
const path = require('path');

const ROOT = '/Users/jonsearle/Desktop/Tenzing 1.0/docs';
const SOURCE_CSV = path.join(ROOT, 'account_prioritisation_challenge_data.csv');
const OUTPUT_HTML = path.join(ROOT, 'account-ranking-review-2026-03-21-spec-rebuild.html');
const TODAY = '2026-03-21';

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        cell += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      row.push(cell);
      cell = '';
      continue;
    }

    if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && next === '\n') {
        i += 1;
      }
      row.push(cell);
      if (row.length > 1 || row[0] !== '') {
        rows.push(row);
      }
      row = [];
      cell = '';
      continue;
    }

    cell += char;
  }

  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }

  const [header, ...records] = rows;
  return records.map((record) => {
    const entry = {};
    header.forEach((key, index) => {
      entry[key] = record[index] ?? '';
    });
    return entry;
  });
}

function asNumber(value) {
  if (value === undefined || value === null || value === '') {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function hasValue(value) {
  return value !== undefined && value !== null && `${value}`.trim() !== '';
}

function completeness(values) {
  return values.filter(hasValue).length / values.length;
}

function clamp(value, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

function floorDayDifference(fromDate, toDate) {
  const from = new Date(`${fromDate}T00:00:00Z`);
  const to = new Date(`${toDate}T00:00:00Z`);
  return Math.round((to - from) / 86400000);
}

function renewalScore(days) {
  if (days <= 30) return 100;
  if (days <= 60) return 75;
  if (days <= 120) return 50;
  if (days <= 180) return 25;
  return 0;
}

function normalizedPositions(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const lastIndex = Math.max(sorted.length - 1, 1);
  const positions = new Map();

  sorted.forEach((value, index) => {
    if (!positions.has(value)) {
      const first = sorted.indexOf(value);
      const last = sorted.lastIndexOf(value);
      const averageIndex = (first + last) / 2;
      positions.set(value, (averageIndex / lastIndex) * 100);
    }
  });

  return values.map((value) => positions.get(value));
}

function includesAny(text, phrases) {
  return phrases.some((phrase) => text.includes(phrase));
}

function extractSignals(account) {
  const support = (account.recent_support_summary || '').toLowerCase();
  const customer = (account.recent_customer_note || '').toLowerCase();
  const sales = (account.recent_sales_note || '').toLowerCase();
  const combined = `${support} ${customer} ${sales}`;

  return {
    negative_sentiment: includesAny(combined, [
      'confidence has dropped',
      'question current value',
      'reliability concerns',
      'unresolved issues',
      'workflow-impacting defects',
      'frustration',
      'raised concern',
      'concern about',
      'trust recovery',
      'defensive rather than expansion-oriented',
      'benchmark alternative vendors',
      'issues continue into renewal planning',
    ]) ? 1 : 0,
    trust_drop: includesAny(combined, [
      'confidence has dropped',
      'question current value',
      'trust recovery',
      'current value received',
    ]) ? 1 : 0,
    executive_concern: includesAny(combined, [
      'main sponsor',
      'economic buyer',
      'leadership',
      'executive review',
      'procurement',
    ]) ? 1 : 0,
    stakeholder_misalignment: includesAny(combined, [
      'varies by stakeholder',
      'positive sponsorship and frustration',
      'uneven across teams',
      'operational users',
      'depends on resolving current adoption concerns',
      'relationship quality varies by stakeholder',
    ]) ? 1 : 0,
    competitive_evaluation: includesAny(combined, [
      'benchmark alternative vendors',
      'competitive',
      'alternative vendors',
    ]) ? 1 : 0,
    renewal_pushback: includesAny(combined, [
      'ahead of renewal',
      'renewal planning',
      'retention',
      'defensive rather than expansion-oriented',
      'commercial discussion',
      'pushback',
    ]) ? 1 : 0,
    expansion_interest: includesAny(combined, [
      'open to expansion',
      'expanding scope',
      'broader deployment',
      'rollout',
      'additional business units',
      'expansion path',
      'upside here',
    ]) ? 1 : 0,
    rollout_intent: includesAny(combined, [
      'rollout',
      'broader deployment',
      'additional business units',
      'expanding scope',
    ]) ? 1 : 0,
    budget_alignment: includesAny(combined, [
      'commercial conversation is active',
      'credible expansion path',
      'commercial discussion',
      'healthy engagement',
      'sponsor alignment',
    ]) ? 1 : 0,
    active_buying_signal: includesAny(combined, [
      'commercial conversation is active',
      'healthy engagement',
      'pipeline looks positive',
      'credible expansion path',
      'firm',
      'momentum through the next review cycle',
    ]) ? 1 : 0,
    stakeholder_support: includesAny(combined, [
      'strong sponsor alignment',
      'positive sponsorship',
      'internal value',
      'strong usage',
      'satisfied',
      'support',
    ]) ? 1 : 0,
    expansion_blocker: includesAny(combined, [
      'no immediate upsell path',
      'retention and trust recovery',
      'needs tighter execution',
      'defensive rather than expansion-oriented',
      'depends on resolving current adoption concerns',
      'unless service confidence improves',
      'not yet firm',
    ]) ? 1 : 0,
  };
}

function capWithArr(arr, uplift) {
  return arr + Math.min(uplift, arr);
}

function formatCurrency(value) {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatScore(value) {
  return value.toFixed(1);
}

function formatDate(value) {
  if (!value) return '';
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${value}T00:00:00Z`));
}

function scoreToRiskStyle(score) {
  const hue = 120 - ((score / 100) * 120);
  return `background: hsl(${hue} 70% 85%); color: hsl(${hue} 55% 18%);`;
}

function scoreToOpportunityStyle(score) {
  const hue = (score / 100) * 120;
  return `background: hsl(${hue} 70% 85%); color: hsl(${hue} 55% 18%);`;
}

function renderCell(value, style = '') {
  return `<td style="${style}">${value}</td>`;
}

function renderTable(title, subtitle, columns, rows) {
  return `
    <section class="panel">
      <div class="panel-head">
        <div>
          <h2>${title}</h2>
          <p>${subtitle}</p>
        </div>
        <div class="badge">${rows.length} accounts ranked</div>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>${columns.map((column) => `<th>${column}</th>`).join('')}</tr>
          </thead>
          <tbody>
            ${rows.join('')}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

const csvText = fs.readFileSync(SOURCE_CSV, 'utf8');
const accounts = parseCsv(csvText);

const enriched = accounts.map((account) => {
  const arr = asNumber(account.arr_gbp) ?? 0;
  const expansionPipeline = asNumber(account.expansion_pipeline_gbp) ?? 0;
  const openLeads = asNumber(account.open_leads_count);
  const avgLeadScore = asNumber(account.avg_lead_score);
  const openTickets = asNumber(account.open_tickets_count);
  const urgentTickets = asNumber(account.urgent_open_tickets_count);
  const slaBreaches = asNumber(account.sla_breaches_90d);
  const seatsPurchased = asNumber(account.seats_purchased);
  const seatsUsed = asNumber(account.seats_used);
  const usage3mAgo = asNumber(account.usage_score_3m_ago);
  const usageCurrent = asNumber(account.usage_score_current);
  const latestNps = asNumber(account.latest_nps);
  const daysToRenewal = floorDayDifference(TODAY, account.renewal_date);
  const noteSignals = extractSignals(account);

  const serviceFailureCompleteness = completeness([openTickets, urgentTickets, slaBreaches]);
  let serviceFailureStrength =
    0.25 * clamp((openTickets ?? 0) / 10) +
    0.4 * clamp((urgentTickets ?? 0) / 5) +
    0.35 * clamp((slaBreaches ?? 0) / 5);
  if ((urgentTickets ?? 0) >= 4 || (slaBreaches ?? 0) >= 4) {
    serviceFailureStrength = Math.max(serviceFailureStrength, 0.75);
  }
  const serviceFailure = serviceFailureStrength * serviceFailureCompleteness;

  const lowAdoptionCompleteness = completeness([seatsPurchased, seatsUsed]);
  const seatUtilisation =
    seatsPurchased && seatsPurchased > 0 && seatsUsed !== null ? seatsUsed / seatsPurchased : null;
  let lowAdoptionStrength = seatUtilisation === null ? 0 : 1 - seatUtilisation;
  if (seatUtilisation !== null && seatUtilisation <= 0.25) {
    lowAdoptionStrength = Math.max(lowAdoptionStrength, 0.75);
  }
  const lowAdoption = clamp(lowAdoptionStrength) * lowAdoptionCompleteness;

  const usageDeclineCompleteness = completeness([usage3mAgo, usageCurrent]);
  const decline = usage3mAgo !== null && usageCurrent !== null ? usage3mAgo - usageCurrent : null;
  let usageDeclineStrength = clamp((decline ?? 0) / 40);
  if ((decline ?? 0) >= 25) {
    usageDeclineStrength = Math.max(usageDeclineStrength, 0.75);
  }
  const usageDecline = usageDeclineStrength * usageDeclineCompleteness;

  const relationshipRiskCompleteness = completeness([
    account.recent_customer_note,
    account.recent_sales_note,
    account.recent_support_summary,
  ]);
  let relationshipRiskStrength =
    0.15 * noteSignals.negative_sentiment +
    0.25 * noteSignals.trust_drop +
    0.2 * noteSignals.executive_concern +
    0.15 * noteSignals.stakeholder_misalignment +
    0.15 * noteSignals.competitive_evaluation +
    0.1 * noteSignals.renewal_pushback;
  if (noteSignals.competitive_evaluation && noteSignals.executive_concern) {
    relationshipRiskStrength = Math.max(relationshipRiskStrength, 0.75);
  }
  const relationshipRisk = relationshipRiskStrength * relationshipRiskCompleteness;

  const expansionCompleteness = completeness([
    expansionPipeline,
    openLeads,
    avgLeadScore,
    account.recent_customer_note,
    account.recent_sales_note,
  ]);
  const pipelineNorm = clamp(expansionPipeline / 50000);
  const leadsNorm = clamp((openLeads ?? 0) / 5);
  const leadScoreNorm = clamp((avgLeadScore ?? 0) / 100);
  const expansionStrength = clamp(
    0.5 * pipelineNorm +
    0.1 * leadsNorm +
    0.15 * leadScoreNorm +
    0.05 * noteSignals.expansion_interest +
    0.05 * noteSignals.rollout_intent +
    0.05 * noteSignals.budget_alignment +
    0.05 * noteSignals.active_buying_signal +
    0.05 * noteSignals.stakeholder_support -
    0.1 * noteSignals.expansion_blocker
  );
  const expansionOpportunity = expansionStrength * expansionCompleteness;

  const lowNps = latestNps === null ? 0 : clamp((50 - latestNps) / 100);
  const lowNpsCompleteness = latestNps === null ? 0 : 1;

  const riskSeverity = (
    serviceFailure +
    relationshipRisk +
    usageDecline +
    0.9 * lowAdoption +
    0.8 * lowNps
  ) / 4.6;

  const riskImportanceRaw = capWithArr(arr, expansionPipeline * 0.2);
  const growthImportanceRaw = capWithArr(arr, expansionPipeline * 0.75);

  return {
    ...account,
    arr,
    expansionPipeline,
    daysToRenewal,
    renewalScore: renewalScore(daysToRenewal),
    noteSignals,
    completeness: {
      serviceFailure: serviceFailureCompleteness,
      lowAdoption: lowAdoptionCompleteness,
      usageDecline: usageDeclineCompleteness,
      relationshipRisk: relationshipRiskCompleteness,
      expansionOpportunity: expansionCompleteness,
      lowNps: lowNpsCompleteness,
    },
    states: {
      serviceFailure,
      relationshipRisk,
      usageDecline,
      lowAdoption,
      lowNps,
      expansionOpportunity,
    },
    riskSeverity,
    riskImportanceRaw,
    growthImportanceRaw,
  };
});

const riskScores = normalizedPositions(enriched.map((account) => account.riskImportanceRaw));
const growthScores = normalizedPositions(enriched.map((account) => account.growthImportanceRaw));

enriched.forEach((account, index) => {
  account.arrPotentialScore = riskScores[index];
  account.growthScore = growthScores[index];
  account.riskSeverityScore = account.riskSeverity * 100;
  account.expansionOpportunityScore = account.states.expansionOpportunity * 100;
  account.finalRiskPriority =
    0.6 * account.riskSeverityScore +
    0.25 * account.arrPotentialScore +
    0.15 * account.renewalScore;
  account.finalGrowthPriority =
    0.65 * account.expansionOpportunityScore +
    0.35 * account.growthScore;
});

const rankedRisk = [...enriched]
  .sort((a, b) => b.finalRiskPriority - a.finalRiskPriority)
  .map((account, index) => ({ ...account, rank: index + 1 }));

const rankedGrowth = [...enriched]
  .sort((a, b) => b.finalGrowthPriority - a.finalGrowthPriority)
  .map((account, index) => ({ ...account, rank: index + 1 }));

function riskRow(account) {
  return `
    <tr>
      ${renderCell(account.rank)}
      ${renderCell(`<strong>${account.account_name}</strong><div class="meta">${account.segment} · ${account.region}</div>`)}
      ${renderCell(formatCurrency(account.arr))}
      ${renderCell(formatDate(account.renewal_date))}
      ${renderCell(account.daysToRenewal)}
      ${renderCell(formatScore(account.renewalScore), scoreToRiskStyle(account.renewalScore))}
      ${renderCell(formatScore(account.arrPotentialScore), scoreToRiskStyle(account.arrPotentialScore))}
      ${renderCell(formatScore(account.riskSeverityScore), scoreToRiskStyle(account.riskSeverityScore))}
      ${renderCell(formatScore(account.finalRiskPriority), scoreToRiskStyle(account.finalRiskPriority))}
      ${renderCell(formatScore(account.states.serviceFailure * 100), scoreToRiskStyle(account.states.serviceFailure * 100))}
      ${renderCell(formatScore(account.states.relationshipRisk * 100), scoreToRiskStyle(account.states.relationshipRisk * 100))}
      ${renderCell(formatScore(account.states.usageDecline * 100), scoreToRiskStyle(account.states.usageDecline * 100))}
      ${renderCell(formatScore(account.states.lowAdoption * 100), scoreToRiskStyle(account.states.lowAdoption * 100))}
      ${renderCell(formatScore(account.states.lowNps * 100), scoreToRiskStyle(account.states.lowNps * 100))}
    </tr>
  `;
}

function growthRow(account) {
  return `
    <tr>
      ${renderCell(account.rank)}
      ${renderCell(`<strong>${account.account_name}</strong><div class="meta">${account.segment} · ${account.region}</div>`)}
      ${renderCell(formatCurrency(account.arr))}
      ${renderCell(formatDate(account.renewal_date))}
      ${renderCell(account.daysToRenewal)}
      ${renderCell(formatScore(account.growthScore), scoreToOpportunityStyle(account.growthScore))}
      ${renderCell(formatScore(account.expansionOpportunityScore), scoreToOpportunityStyle(account.expansionOpportunityScore))}
      ${renderCell(formatScore(account.finalGrowthPriority), scoreToOpportunityStyle(account.finalGrowthPriority))}
      ${renderCell(formatScore(account.states.serviceFailure * 100), scoreToRiskStyle(account.states.serviceFailure * 100))}
      ${renderCell(formatScore(account.states.relationshipRisk * 100), scoreToRiskStyle(account.states.relationshipRisk * 100))}
      ${renderCell(formatScore(account.states.usageDecline * 100), scoreToRiskStyle(account.states.usageDecline * 100))}
      ${renderCell(formatScore(account.states.lowAdoption * 100), scoreToRiskStyle(account.states.lowAdoption * 100))}
      ${renderCell(formatScore(account.states.lowNps * 100), scoreToRiskStyle(account.states.lowNps * 100))}
    </tr>
  `;
}

const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Tenzing Spec Rebuild Review</title>
    <style>
      :root {
        --bg: #f4f0e8;
        --panel: rgba(255, 252, 247, 0.88);
        --line: rgba(48, 37, 28, 0.12);
        --ink: #2f241b;
        --muted: #6b5d51;
        --accent: #8b5e3c;
        --shadow: 0 20px 60px rgba(73, 46, 24, 0.12);
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        font-family: "Iowan Old Style", "Palatino Linotype", serif;
        background:
          radial-gradient(circle at top left, rgba(160, 116, 74, 0.12), transparent 28%),
          linear-gradient(180deg, #f7f2ea 0%, #efe7da 100%);
        color: var(--ink);
      }

      main {
        width: min(1500px, calc(100vw - 32px));
        margin: 0 auto;
        padding: 32px 0 40px;
      }

      .hero {
        background: linear-gradient(140deg, rgba(255,255,255,0.82), rgba(252,246,238,0.9));
        border: 1px solid var(--line);
        border-radius: 24px;
        box-shadow: var(--shadow);
        padding: 28px 28px 22px;
        margin-bottom: 22px;
      }

      h1, h2 {
        margin: 0;
        font-weight: 600;
        letter-spacing: -0.02em;
      }

      h1 {
        font-size: clamp(2rem, 4vw, 3.3rem);
      }

      h2 {
        font-size: 1.5rem;
      }

      p {
        margin: 0;
        color: var(--muted);
        line-height: 1.45;
      }

      .hero p {
        max-width: 72ch;
        margin-top: 10px;
      }

      .summary {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
        gap: 12px;
        margin-top: 18px;
      }

      .summary-card, .panel {
        background: var(--panel);
        border: 1px solid var(--line);
        border-radius: 20px;
        box-shadow: var(--shadow);
      }

      .summary-card {
        padding: 16px 18px;
      }

      .summary-card strong {
        display: block;
        font-size: 1.6rem;
        color: var(--ink);
      }

      .summary-card span {
        color: var(--muted);
        font-size: 0.95rem;
      }

      .layout {
        display: grid;
        gap: 22px;
      }

      .panel {
        overflow: hidden;
      }

      .panel-head {
        display: flex;
        justify-content: space-between;
        align-items: end;
        gap: 16px;
        padding: 20px 22px 16px;
        border-bottom: 1px solid var(--line);
      }

      .panel-head p {
        margin-top: 6px;
      }

      .badge {
        white-space: nowrap;
        padding: 8px 12px;
        border-radius: 999px;
        background: rgba(139, 94, 60, 0.1);
        color: var(--accent);
        font-size: 0.88rem;
      }

      .table-wrap {
        overflow: auto;
      }

      table {
        width: 100%;
        border-collapse: collapse;
        min-width: 1280px;
      }

      th, td {
        padding: 11px 12px;
        border-bottom: 1px solid var(--line);
        text-align: left;
        font-size: 0.92rem;
        white-space: nowrap;
      }

      th {
        position: sticky;
        top: 0;
        z-index: 1;
        background: #f8f2ea;
        color: #5b4a3a;
        font-size: 0.78rem;
        text-transform: uppercase;
        letter-spacing: 0.06em;
      }

      tbody tr:hover {
        background: rgba(139, 94, 60, 0.045);
      }

      .meta {
        color: var(--muted);
        font-size: 0.78rem;
        margin-top: 4px;
      }

      .footer {
        margin-top: 16px;
        font-size: 0.85rem;
        color: var(--muted);
      }

      @media (max-width: 720px) {
        main {
          width: min(100vw - 20px, 1500px);
          padding-top: 20px;
        }

        .hero, .panel-head {
          padding-left: 16px;
          padding-right: 16px;
        }

        .panel-head {
          align-items: start;
          flex-direction: column;
        }
      }
    </style>
  </head>
  <body>
    <main>
      <section class="hero">
        <h1>Tenzing Review Rebuild From Live Spec</h1>
        <p>
          This page was generated from <code>product-definition-spec.md</code> plus
          <code>account_prioritisation_challenge_data.csv</code>, using the live spec as the
          sole source of truth for formulas and ranking logic. Date assumptions use
          ${TODAY}.
        </p>
        <div class="summary">
          <div class="summary-card">
            <strong>${accounts.length}</strong>
            <span>Accounts ranked in each queue</span>
          </div>
          <div class="summary-card">
            <strong>${rankedRisk[0].account_name}</strong>
            <span>Highest risk priority account</span>
          </div>
          <div class="summary-card">
            <strong>${rankedGrowth[0].account_name}</strong>
            <span>Top growth opportunity account</span>
          </div>
          <div class="summary-card">
            <strong>${formatDate(TODAY)}</strong>
            <span>Reference date for renewal calculations</span>
          </div>
        </div>
      </section>

      <div class="layout">
        ${renderTable(
          'Biggest Risks',
          'Risk states are shaded green-to-red. Higher values indicate higher severity or priority.',
          [
            'Rank',
            'Account',
            'ARR £',
            'Renewal Date',
            'Days',
            'Renewal Score',
            'ARR+Potential Score',
            'Risk Severity',
            'Risk Priority',
            'Service Failure',
            'Relationship Risk',
            'Usage Decline',
            'Low Adoption',
            'Low NPS',
          ],
          rankedRisk.map(riskRow)
        )}

        ${renderTable(
          'Best Growth Opportunities',
          'Expansion Opportunity uses an inverted opportunity scale, where stronger opportunity is greener.',
          [
            'Rank',
            'Account',
            'ARR £',
            'Renewal Date',
            'Days',
            'Growth Score',
            'Expansion Opportunity',
            'Growth Priority',
            'Service Failure',
            'Relationship Risk',
            'Usage Decline',
            'Low Adoption',
            'Low NPS',
          ],
          rankedGrowth.map(growthRow)
        )}
      </div>

      <p class="footer">
        Spec-driven rebuild output: ${path.basename(OUTPUT_HTML)}
      </p>
    </main>
  </body>
</html>`;

fs.writeFileSync(OUTPUT_HTML, html, 'utf8');
console.log(`Wrote ${OUTPUT_HTML}`);
