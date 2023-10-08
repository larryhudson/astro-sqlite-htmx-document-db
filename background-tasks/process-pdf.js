import { updateRecord, getRecordById, createRecord } from "../src/utils/db.js";
import { extractTextFromPDFBoxes } from "../src/utils/pdf2json.js";
import PDFParser from "pdf2json";

export async function processPdf({ documentId }) {
  const document = getRecordById("documents", documentId);

  updateRecord("documents", documentId, { status: "processing" });

  const pdfPath = document.filepath;

  await new Promise((resolve) => {
    const pdfParser = new PDFParser();

    let pageNum = 1;

    pdfParser.on("readable", (meta) => {
      console.log("PDF Metadata", meta);
    });
    pdfParser.on("data", (page) => {
      if (page) {
        // console.log(page);
        console.log("page number", pageNum);
        const pageText = extractTextFromPDFBoxes(page.Texts);
        createRecord("document_pages", {
          document_id: documentId,
          page_number: pageNum,
          text_content: pageText,
        });
        pageNum++;
      } else {
        resolve();
      }
    });
    pdfParser.on("error", (err) => console.error("Parser Error", err));

    pdfParser.loadPDF(pdfPath);
  });

  await new Promise((resolve) => setTimeout(resolve, 5000));

  const now = new Date();
  const dateString = now.toISOString();
  updateRecord("documents", documentId, {
    status: "processed",
    processed_at: dateString,
  });
  return true;
}
