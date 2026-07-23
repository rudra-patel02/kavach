import type { Metadata, Viewport } from "next";
import PwaRegistration from "@/components/layout/PwaRegistration";
import ThemePersistence from "@/components/layout/ThemePersistence";
import "./globals.css";

export const metadata: Metadata = {
  title: "KAVACH Industrial Dashboard",
  description: "Real-time industrial monitoring and decision intelligence",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#0891b2",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <ThemePersistence />
        <PwaRegistration />
        {children}
      </body>
    </html>
  );
}
