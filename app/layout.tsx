import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { ServiceWorkerRegistration } from "@/components/pwa/service-worker-registration";

export const metadata: Metadata = {
  title: "iTraxc — Betting Performance Tracker",
  description: "A personal, private way to track bets, results, and bankroll performance over time.",
  appleWebApp: {
    capable: true,
    title: "iTraxc",
    // "default" keeps the standard opaque status bar rather than letting
    // content draw underneath it — simpler and safer than
    // "black-translucent" for this beta, and it means content never needs
    // to account for the status bar itself. The floating home indicator on
    // notched iPhones is a separate concern, handled via
    // safe-area-inset-bottom in the app shell regardless of this setting.
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Lets the page draw into (and CSS read) the safe-area-inset-* regions —
  // without this, env(safe-area-inset-*) resolves to 0 on iOS and the
  // bottom nav/home-indicator spacing below would have nothing to react to.
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f8fa" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0f16" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full flex flex-col">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
