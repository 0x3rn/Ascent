"use client";

import React, { useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { ResumePreview } from "@/components/preview/resume-preview";

export function PdfExportButton() {
  const componentRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: "resume",
    pageStyle: `
      @page {
        size: A4;
        margin: 0;
      }
      @media print {
        html, body {
          margin: 0;
          padding: 0;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
      }
    `,
  });

  return (
    <>
      {/* Hidden printable element */}
      <div style={{ display: "none" }}>
        <div ref={componentRef}>
          <ResumePreview />
        </div>
      </div>

      <Button
        onClick={() => handlePrint()}
        size="sm"
        className="gap-1.5"
        variant="default"
      >
        <Download className="h-3.5 w-3.5" />
        Download PDF
      </Button>
    </>
  );
}