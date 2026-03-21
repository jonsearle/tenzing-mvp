import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tenzing MVP",
  description: "Authenticated portfolio foundation backed by server-side CSV ingestion.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

