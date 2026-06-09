import { PDFParse } from "pdf-parse";
import fs from "fs";

async function run() {
  try {
    // create a dummy PDF buffer (minimum valid PDF)
    const dummyPdf = Buffer.from(
      "%PDF-1.0\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj 3 0 obj<</Type/Page/MediaBox[0 0 3 3]>>endobj\ntrailer<</Size 4/Root 1 0 R>>\nEOF"
    );
    const parser = new PDFParse({ data: dummyPdf });
    const textResult = await parser.getText();
    console.log("SUCCESS:", textResult.text);
  } catch (err) {
    console.error("ERROR:", err);
  }
}
run();
