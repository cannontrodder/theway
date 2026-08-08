import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const playfairDisplay = Playfair_Display({
  variable: "--font-playfair-display",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "The Way",
  description:
    "Our Camino. Our Journey. Logroño to Burgos, 4–11 October 2026.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${playfairDisplay.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <SiteHeader dates="4–11 October 2026" />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
