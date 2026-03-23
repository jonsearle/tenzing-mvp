import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

type ReviewerHeaderProps = {
  homeHref: string;
  logoHref?: string;
  showSignOut?: boolean;
  rightSlot?: ReactNode;
};

export function ReviewerHeader({
  homeHref,
  logoHref = homeHref,
  showSignOut = false,
  rightSlot = null,
}: ReviewerHeaderProps) {
  return (
    <header className="portfolioV2Header">
      <Link aria-label="Tenzing portfolio" href={logoHref}>
        <Image
          alt="Tenzing"
          className="portfolioV2Logo"
          height={57}
          priority
          src="/tenzing-logo.png"
          width={228}
        />
      </Link>
      <div className="portfolioV2HeaderActions">
        <Link className="portfolioV2HeaderButton portfolioV2HeaderButton--primary" href="/write-up">
          Read write-up
        </Link>
        {rightSlot}
        {showSignOut ? (
          <form action="/auth/sign-out" method="post">
            <button className="portfolioV2TextButton" type="submit">
              Sign out
            </button>
          </form>
        ) : null}
      </div>
    </header>
  );
}
