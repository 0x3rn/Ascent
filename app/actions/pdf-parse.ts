"use server";

import { PDFParse } from "pdf-parse";

export async function parsePdfServer(formData: FormData) {
  const file = formData.get("file") as File;
  if (!file) throw new Error("No file provided");
  
  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Parse the PDF buffer into text
    const parser = new PDFParse({ data: buffer });
    const data = await parser.getText();
    
    return data.text || "";
  } catch (error) {
    console.error("Failed to parse PDF on server:", error);
    throw new Error("Failed to parse PDF. Please ensure the file is a valid PDF document.");
  }
}
