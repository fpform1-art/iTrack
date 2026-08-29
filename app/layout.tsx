import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "iTrack — Betting Performance Tracker",
  description: "A personal, private way to track bets, results, and bankroll performance over time.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
