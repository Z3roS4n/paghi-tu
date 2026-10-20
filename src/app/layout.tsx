import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const ensureStatic = "navigation";

export const metadata: Metadata = {
  title: {
    default: "Paghi Tu: spese dello Stato e promesse elettorali, con le fonti",
    template: "%s | Paghi Tu",
  },
  description:
    "Quanto spende lo Stato, cosa promettono i partiti, quanto costano le misure approvate. Solo dati verificati su fonte primaria, dal 1946 a oggi.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="it" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
