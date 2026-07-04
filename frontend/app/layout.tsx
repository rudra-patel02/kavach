import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "KAVACH Industrial Dashboard",
  description: "Real-time industrial monitoring and decision intelligence",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
