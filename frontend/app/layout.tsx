import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "KAVACH — Plant Decision Intelligence",
  description: "Real telemetry-derived KPIs and closed-loop work orders for one plant.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full bg-slate-50 antialiased">{children}</body>
    </html>
  );
}
