import Link from "next/link";

export default function AccountNotFound() {
  return (
    <main className="shell stack">
      <section className="panel stack">
        <span className="eyebrow">Missing account</span>
        <h1>We could not find that `account_id`.</h1>
        <p className="muted">
          Check the canonical identifier and try the protected portfolio list
          again.
        </p>
        <Link className="buttonSecondary" href="/portfolio">
          Back to portfolio
        </Link>
      </section>
    </main>
  );
}

