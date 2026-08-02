"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/Button";

// Deliberately just window.print() + @media print CSS rather than a PDF
// library — the browser's own "Save as PDF" print destination produces a
// perfectly good invoice PDF with zero extra dependencies to maintain.
export function PrintButton() {
  return (
    <Button variant="secondary" className="print:hidden" onClick={() => window.print()}>
      <Printer size={16} /> Print / Save as PDF
    </Button>
  );
}
