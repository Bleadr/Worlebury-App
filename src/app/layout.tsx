import type { Metadata } from "next";
import { archivo, spectral } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Worlebury | Business Management",
  description: "CRM, finance, reporting and resource management for the Worlebury group.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${archivo.variable} ${spectral.variable}`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
