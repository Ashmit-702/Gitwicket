import type { Metadata } from "next";
import { Oswald, Work_Sans, IBM_Plex_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const display = Oswald({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--font-display" });
const body = Work_Sans({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-body" });
const mono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["500", "600"], variable: "--font-mono" });

const SITE_URL = "https://gitwicket.dev"; // swap for your real domain once deployed

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "GitWicket — your GitHub, rated as a cricket card",
  description:
    "Turn any GitHub profile into a cricket player card. Real commits become strike rate, PRs become wickets, stars become boundaries. Rate your GitHub out of 99.",
  keywords: [
    "github cricket card",
    "rate my github cricket",
    "github stats cricket score",
    "cricket player card generator github",
    "github profile card cricket",
  ],
  openGraph: {
    title: "GitWicket — your GitHub, rated as a cricket card",
    description: "Real commits become strike rate. Real PRs become wickets. Get your card.",
    siteName: "GitWicket",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "GitWicket — your GitHub, rated as a cricket card",
    description: "Real commits become strike rate. Real PRs become wickets. Get your card.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body className="font-body">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
