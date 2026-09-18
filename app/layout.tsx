import type { Metadata } from "next";
import "./globals.css";
import { GlobalErrorListener } from "@/components/GlobalErrorListener";

export const metadata: Metadata = {
  title: {
    default: "Vorexa | Property Management Dashboard",
    template: "%s | Vorexa",
  },
  description:
    "Vorexa's Property Management Dashboard - buildings, tenants, leasing, arrears, meetings and more in one place.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body>
        <GlobalErrorListener />
        {children}
      </body>
    </html>
  );
}
