import Link from "next/link";

export default function AccountV2NotFound() {
  return (
    <main className="portfolioV2Page">
      <div className="portfolioV2Shell">
        <section className="portfolioV2Section portfolioV2Section--tightTop">
          <div className="portfolioV2SectionHeader">
            <h1>Account not found</h1>
            <Link className="portfolioV2SectionLink" href="/portfolio-v2">
              Back to portfolio
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
