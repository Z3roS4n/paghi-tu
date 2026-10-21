import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Courier_Prime, Figtree } from "next/font/google";
import { InViewMarker } from "@/components/in-view";
import { MobileDock } from "@/components/mobile-dock";
import { SiteAnalytics } from "@/components/site-analytics";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import "./globals.css";

const figtree = Figtree({ variable: "--font-figtree", subsets: ["latin"] });
const bricolage = Bricolage_Grotesque({ variable: "--font-bricolage", subsets: ["latin"] });
const courier = Courier_Prime({ variable: "--font-courier", subsets: ["latin"], weight: ["400", "700"] });

export const ensureStatic = "navigation";

export const metadata: Metadata = {
  title: {
    default: "Paghi Tu: spese dello Stato e promesse elettorali, con le fonti",
    template: "%s | Paghi Tu",
  },
  description:
    "Quanto spende lo Stato, cosa promettono i partiti, quanto costano le misure approvate. Solo dati verificati su fonte primaria, dal 1946 a oggi.",
};

export const viewport: Viewport = {
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#eceeee" },
    { media: "(prefers-color-scheme: dark)", color: "#14181a" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // La classe `js` arriva prima del primo disegno: le animazioni nascondono il contenuto solo se poi c'è chi lo rivela.
    <html lang="it" suppressHydrationWarning className={`${figtree.variable} ${bricolage.variable} ${courier.variable} h-full antialiased`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
      </head>
      <body className="flex min-h-full flex-col font-sans text-[17px] leading-relaxed">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
        <MobileDock />
        <InViewMarker />
        <SiteAnalytics />
      </body>
    </html>
  );
}
