"use server";

// @ts-expect-error pdf-parse has no default export in its ESM definition
import pdfParse from "pdf-parse";

export async function parsePdfServer(formData: FormData) {
  const file = formData.get("file") as File;
  if (!file) return "";
  
  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Parse the PDF buffer into text
    const data = await pdfParse(buffer);
    
    return data.text || "";
  } catch (error) {
    console.error("Failed to parse PDF on server:", error);
    throw new Error("Failed to parse PDF. Please ensure the file is a valid PDF document.");
  }
}
