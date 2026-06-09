import fs from "fs";

async function run() {
  try {
    const dummyPdf = Buffer.from(
      "%PDF-1.0\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj 3 0 obj<</Type/Page/MediaBox[0 0 3 3]>>endobj\ntrailer<</Size 4/Root 1 0 R>>\nEOF"
    );
    const formData = new FormData();
    formData.append("file", new Blob([dummyPdf]), "dummy.pdf");

    const res = await fetch("http://localhost:3000/api/parse-pdf", {
      method: "POST",
      body: formData,
    });
    
    console.log("STATUS:", res.status);
    console.log("BODY:", await res.text());
  } catch (err) {
    console.error("ERROR:", err);
  }
}
run();
