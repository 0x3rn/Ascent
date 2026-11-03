import { NextRequest, NextResponse } from "next/server";

function sanitizePdfFilename(rawName: string): string {
  const cleaned = rawName
    .replace(/[\r\n"\\<>|?*:/]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const base = cleaned || "Document.pdf";
  return base.toLowerCase().endsWith(".pdf") ? base : `${base}.pdf`;
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ filename: string }> }
) {
  try {
    const params = await context.params;
    const formData = await request.formData();
    const pdfBase64 = formData.get("pdfBase64");
    const formFilename = formData.get("filename");

    if (typeof pdfBase64 !== "string" || !pdfBase64) {
      return NextResponse.json(
        { error: "Missing PDF payload." },
        { status: 400 }
      );
    }

    const rawFilename =
      typeof formFilename === "string" && formFilename.trim()
        ? formFilename
        : decodeURIComponent(params.filename || "Document.pdf");
    const safeFilename = sanitizePdfFilename(rawFilename);
    const asciiFilename = safeFilename.replace(/[^\x20-\x7E]/g, "_");
    const encodedFilename = encodeURIComponent(safeFilename);

    const pdfBuffer = Buffer.from(pdfBase64, "base64");
    if (
      pdfBuffer.byteLength < 8 ||
      pdfBuffer.subarray(0, 5).toString("ascii") !== "%PDF-"
    ) {
      return NextResponse.json(
        { error: "Invalid PDF binary payload." },
        { status: 400 }
      );
    }

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="${asciiFilename}"; filename*=UTF-8''${encodedFilename}`,
        "Content-Length": String(pdfBuffer.byteLength),
        "Cache-Control": "no-store, no-cache, must-revalidate",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to process PDF download." },
      { status: 500 }
    );
  }
}
