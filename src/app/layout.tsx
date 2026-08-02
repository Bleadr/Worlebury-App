import type { Metadata } from "next";
import { archivo, spectral } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Worlebury | Business Management",
  description: "CRM, finance, reporting and resource management for the Worlebury group.",
};

// Runs before React hydrates so the correct theme applies on first paint —
// avoids a flash of the wrong theme. Kept tiny and dependency-free.
const themeInitScript = `
(function () {
  try {
    var stored = localStorage.getItem("worlebury-theme");
    var prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    var isDark = stored ? stored === "dark" : prefersDark;
    if (isDark) document.documentElement.classList.add("dark");
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${archivo.variable} ${spectral.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="font-sans antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
