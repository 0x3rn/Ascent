import assert from "node:assert/strict";
import test from "node:test";
import {
  buildNativePdfBytes,
  escapePdfLiteralString,
  type RenderedPageData,
} from "../lib/pdf-export.ts";

test("escapes PDF literal strings safely for WinAnsi text streams", () => {
  const escaped = escapePdfLiteralString(
    " Alexandra (Senior PM) — 100% \\ Notion’s “Core” "
  );
  assert.equal(escaped, " Alexandra \\(Senior PM\\) - 100% \\\\ Notion's \"Core\" ");
});

test("builds a valid multi-page %PDF-1.4 document with DCTDecode images and searchable text", () => {
  const fakeJpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0xff, 0xd9]);
  const pages: RenderedPageData[] = [
    {
      jpegBytes: fakeJpeg,
      widthPx: 1588,
      heightPx: 2246,
      textItems: [
        { text: "ALEXANDRA STERLING", xPt: 180, yPt: 780, fontSizePt: 18 },
        { text: "Senior Product Manager", xPt: 210, yPt: 760, fontSizePt: 11.5 },
      ],
    },
    {
      jpegBytes: fakeJpeg,
      widthPx: 1588,
      heightPx: 2246,
      textItems: [
        { text: "Page 2 Experience Continuation", xPt: 54, yPt: 790, fontSizePt: 10.5 },
      ],
    },
  ];

  const pdfBytes = buildNativePdfBytes(pages);
  const pdfText = Buffer.from(pdfBytes).toString("latin1");

  // Header & EOF
  assert.ok(pdfText.startsWith("%PDF-1.4\n"));
  assert.ok(pdfText.endsWith("%%EOF"));

  // Catalog, Pages, Font, and 2 Pages (3 + 2 * 3 = 9 objects)
  assert.match(pdfText, /<< \/Type \/Catalog \/Pages 2 0 R >>/);
  assert.match(pdfText, /<< \/Type \/Pages \/Kids \[4 0 R 7 0 R\] \/Count 2 >>/);
  assert.match(pdfText, /<< \/Type \/Font \/Subtype \/Type1 \/BaseFont \/Helvetica \/Encoding \/WinAnsiEncoding >>/);

  // MediaBox A4 dimensions and DCTDecode XObject streams
  assert.match(pdfText, /\/MediaBox \[0 0 595\.28 841\.89\]/);
  assert.match(pdfText, /\/Subtype \/Image \/Width 1588 \/Height 2246 \/ColorSpace \/DeviceRGB \/BitsPerComponent 8 \/Filter \/DCTDecode/);

  // Searchable invisible text layer
  assert.match(pdfText, /BT 3 Tr \/F1 18 Tf 1 0 0 1 180 780 Tm \(ALEXANDRA STERLING\) Tj ET/);
  assert.match(pdfText, /BT 3 Tr \/F1 10\.5 Tf 1 0 0 1 54 790 Tm \(Page 2 Experience Continuation\) Tj ET/);

  // Verify xref table offsets point to exact object headers
  const xrefMatch = pdfText.match(/xref\n0 10\n0000000000 65535 f \n((?:\d{10} 00000 n \n){9})/);
  assert.ok(xrefMatch, "xref table should have 9 object entries");
  const lines = xrefMatch[1].trim().split("\n");
  lines.forEach((line, idx) => {
    const offset = Number.parseInt(line.slice(0, 10), 10);
    const objId = idx + 1;
    const sliceAtOffset = pdfText.slice(offset, offset + 12);
    assert.ok(
      sliceAtOffset.startsWith(`${objId} 0 obj\n`),
      `Object ${objId} offset ${offset} should point to "${objId} 0 obj", got "${sliceAtOffset}"`
    );
  });
});
