import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "মারিয়া মোবাইল বাজার | Mariya Mobile Bazar — Benapole, Jessore",
    template: "%s | Mariya Mobile Bazar",
  },
  icons: { icon: "/favicon.svg", apple: "/favicon.svg" },
  description:
    "Mariya Mobile Bazar (মারিয়া মোবাইল বাজার), Benapole, Jessore - genuine smartphones and accessories with official warranty, cash on delivery all over Bangladesh.",
  keywords: [
    "Mariya Mobile Bazar",
    "মারিয়া মোবাইল বাজার",
    "mobile shop Benapole",
    "Jessore mobile price",
    "iPhone price Bangladesh",
    "smartphone BD",
  ],
  openGraph: {
    title: "Mariya Mobile Bazar — Benapole, Jessore",
    description:
      "Genuine smartphones & accessories with official warranty. Cash on delivery across Bangladesh.",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#d81f26",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="bn">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&family=Noto+Sans+Bengali:wght@400;600;700&display=swap"
        />
      </head>
      <body className="min-h-screen bg-white text-[#0d0d0d] antialiased">{children}</body>
    </html>
  );
}
