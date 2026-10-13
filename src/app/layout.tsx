import type { Metadata } from "next";
import localFont from "next/font/local";
import { Providers } from "@/components/providers";
import "./globals.css";
const geist = localFont({
  src: "../../public/fonts/geist-latin.woff2",
  variable: "--font-geist",
  display: "swap",
  weight: "100 900",
});
export const metadata: Metadata = {
  title: { default: "AgentLab — Test. Listen. Improve.", template: "%s · AgentLab" },
  description:
    "A developer-focused studio for testing and evaluating AI voice agents. Explore a free, private Demo Mode, review transcripts, and save manual evaluations.",
  applicationName: "AgentLab",
  robots: { index: true, follow: true },
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={geist.variable}>
      <body>
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
