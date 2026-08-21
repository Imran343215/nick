import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PhoneFix Pro — Mobile Repair Shop",
  description:
    "Fast, reliable smartphone repair. Cracked screens, dead batteries, water damage and software issues — fixed the same day with a 90-day warranty.",
};

export const viewport: Viewport = {
  themeColor: "#060a13",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}