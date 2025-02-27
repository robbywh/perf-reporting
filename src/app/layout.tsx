import { ClerkProvider } from "@clerk/nextjs";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

export const metadata = {
  title: "Performance Reporting Dashboard",
  description:
    "View performance reports, charts, and top performers in the Performance Reporting Dashboard.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>
          <SpeedInsights />
          <Analytics />
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
