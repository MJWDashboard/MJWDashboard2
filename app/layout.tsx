import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vorexa Vault",
  description: "Desktop Property Manager platform for Vorexa",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body>{children}</body>
    </html>
  );
}
