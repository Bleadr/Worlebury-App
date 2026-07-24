import { Archivo, Spectral } from "next/font/google";

// Archivo — secondary typeface per brand guidelines: UI, labels & body.
export const archivo = Archivo({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-archivo",
  display: "swap",
});

// Spectral — primary typeface: wordmark & headings. Loaded with italics too
// since the brand guide's tagline treatment ("Audit · Consulting · Finance")
// uses an italic cut.
export const spectral = Spectral({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-spectral",
  display: "swap",
});
