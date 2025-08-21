import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Navbar from "./components/Navbar";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://calculator.ratio1.ai"),
  title: "Ratio1 Calculator",
  description:
    "Ratio1 calculation tools to guide your research and decision to join the ecosystem-ROI, break-even, APR, and more.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    locale: "en_US",
    type: "article",
    title: "Ratio1 Calculator",
    description:
      "Ratio1 calculation tools to guide your research and decision to join the ecosystem-ROI, break-even, APR, and more.",
    url: "https://calculator.ratio1.ai",
    siteName: "Ratio1 Calculator",
    publishedTime: "2024-08-04T12:51:35+02:00",
    images: [
      {
        url: "https://calculator.ratio1.ai/assets/Calculator.png",
        width: 1200,
        height: 630,
        alt: "Ratio1 Calculator",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Ratio1 Calculator",
    description:
      "Ratio1 calculation tools to guide your research and decision to join the ecosystem-ROI, break-even, APR, and more.",
    site: "@ratio1ai",
    creator: "@ratio1ai",
    images: [
      {
        url: "https://calculator.ratio1.ai/assets/Calculator.png",
        alt: "Ratio1 Calculator",
        type: "image/png",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/site.webmanifest" />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/apple-touch-icon.png"
        />
        <link rel="icon" type="image/svg+xml" href="/favicon.ico" />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/favicon-32x32.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/favicon-16x16.png"
        />
        <meta name="msapplication-TileColor" content="#1b47f7" />
        <meta name="theme-color" content="#1b47f7" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Ratio1 Calculator" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Navbar />
        {children}
        <div className="flex flex-row justify-center items-center bg-slate-50 py-20 text-slate-900">
          ©
          <a href="https://ratio1.ai/" className="accent font-medium mr-1">
            Ratio1
          </a>{" "}
          2025. All rights reserved.
        </div>
      </body>
    </html>
  );
}
