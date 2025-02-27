import { ClerkProvider } from "@clerk/nextjs";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import Head from "next/head";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <Head>
          <title>Performance Reporting Dashboard</title>
          <meta
            name="description"
            content="View performance reports, charts, and top performers in the Performance Reporting Dashboard."
          />
        </Head>
        <SpeedInsights />
        <Analytics />
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
