import { ClerkProvider } from "@clerk/nextjs";
import ToastProvider from "@/components/ui/toast";
import type { Metadata, Viewport } from "next";
import { buildThemeCss, fetchTheme } from "@/lib/theme";
// This file is used to define the root layout of the application, including metadata and viewport settings. It imports global CSS styles and sets up the HTML structure for the app. The metadata includes the title and description for SEO purposes, while the viewport settings ensure proper scaling on different devices. The RootLayout component wraps the children components in an HTML structure with a specified language attribute.  
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const theme = await fetchTheme();
  return {
    title: `${theme.brandName} — Mobile Repair Shop`,
    description:
      theme.brandTagline ||
      "Fast, reliable phone, laptop and gadget repair in Kilburn, London. Screen repairs, batteries, water damage and more.",
  };
}

export const viewport: Viewport = {
  themeColor: "#060a13",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Load the admin-configured theme and inject it as CSS variable overrides
  // so every page (landing, store, repair catalog…) picks up the theme.
  const theme = await fetchTheme();

  return (
    <html lang="en">
      <body>
        <style dangerouslySetInnerHTML={{ __html: buildThemeCss(theme) }} />
        <ClerkProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}