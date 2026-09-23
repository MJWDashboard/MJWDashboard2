import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  metadataBase: new URL("https://core.vorexa.co.za"),
  title: {
    default: "Vorexa Core",
    template: "%s · Vorexa Core",
  },
  description: "Your life, organised around you. Vorexa Core is a private personal operating system connecting your daily attention with the records behind it.",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: "/icons/icon-180.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Vorexa Core",
  },
  openGraph: {
    title: "Vorexa Core",
    description: "Your life, organised around you. A private personal operating system by Vorexa.",
    url: "https://core.vorexa.co.za",
    siteName: "Vorexa Core",
    images: [{ url: "/brand/og-preview.jpg", width: 1200, height: 630 }],
    locale: "en_ZA",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Vorexa Core",
    description: "Your life, organised around you.",
    images: ["/brand/og-preview.jpg"],
  },
  robots: {
    index: false,
    follow: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#0B1F44",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${mono.variable}`}>
      <body className="font-sans">
        <ServiceWorkerRegistration />
        {children}
      </body>
    </html>
  );
}
