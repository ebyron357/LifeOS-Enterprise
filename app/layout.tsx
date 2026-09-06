import type { Metadata } from "next";
import "./globals.css";
import "./os.css";

export const metadata: Metadata = {
  title: "LifeOS",
  description: "Personal and business command center. See what needs you, resume work, capture, journal, and ask LifeOS.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
