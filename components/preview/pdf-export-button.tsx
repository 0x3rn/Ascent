"use client";

import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { ResumePreview } from "@/components/preview/resume-preview";
import { exportElementToPdf } from "@/lib/pdf-export";

export function PdfExportButton() {
  const componentRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);

  const handleDownload = async () => {
    if (exporting || !componentRef.current) return;
    setExporting(true);
    try {
      const targetEl =
        (componentRef.current.firstElementChild as HTMLElement | null) ??
        componentRef.current;
      await exportElementToPdf(targetEl, "resume.pdf");
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      <div
        aria-hidden="true"
        className="fixed -left-[10000px] top-0 w-[210mm] pointer-events-none select-none overflow-visible print:hidden"
      >
        <div ref={componentRef}>
          <ResumePreview />
        </div>
      </div>

      <Button
        onClick={handleDownload}
        disabled={exporting}
        size="sm"
        className="gap-1.5"
        variant="default"
      >
        {exporting ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Download className="h-3.5 w-3.5" />
        )}
        {exporting ? "Building PDF..." : "Download PDF"}
      </Button>
    </>
  );
}
