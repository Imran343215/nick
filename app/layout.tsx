import type { Metadata, Viewport } from "next";
// This file is used to define the root layout of the application, including metadata and viewport settings. It imports global CSS styles and sets up the HTML structure for the app. The metadata includes the title and description for SEO purposes, while the viewport settings ensure proper scaling on different devices. The RootLayout component wraps the children components in an HTML structure with a specified language attribute.  
import "./globals.css";

export const metadata: Metadata = {
  title: "iTechnick Ltd — Mobile Repair Shop",
  description:
    "Fast, reliable phone, laptop and gadget repair in Kilburn, London. Screen repairs, batteries, water damage and more.",
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