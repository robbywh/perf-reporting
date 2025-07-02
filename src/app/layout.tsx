import { ClerkProvider } from "@clerk/nextjs";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import localFont from "next/font/local";
import "./globals.css";

// Optimize font loading with next/font
const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
  display: "swap",
  preload: true,
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
  display: "swap",
  preload: false, // Preload only the main font
});

export const metadata = {
  title: "Performance Reporting Dashboard",
  description:
    "View performance reports, charts, and top performers in the Performance Reporting Dashboard.",
  keywords: "performance, reporting, dashboard, engineering, metrics",
  robots: "index, follow",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider afterSignOutUrl="/">
      <html lang="en">
        <head>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link
            rel="preconnect"
            href="https://fonts.gstatic.com"
            crossOrigin="anonymous"
          />
          <link rel="dns-prefetch" href="https://vercel.com" />
          <style
            dangerouslySetInnerHTML={{
              __html: `
                body { 
                  margin: 0; 
                  padding: 0; 
                  font-family: var(--font-geist-sans), system-ui, -apple-system, sans-serif;
                  font-display: swap;
                }
                .animate-pulse { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
                @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .5; } }
              `,
            }}
          />
        </head>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <SpeedInsights />
          <Analytics />
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
