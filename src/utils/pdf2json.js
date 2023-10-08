import PDFParser from "pdf2json";

// thank you ChatGPT for this!

function extractTextFromPDFBoxesWithColumns(boxes) {
  const yThreshold = 1;
  const xThreshold = 1;
  const columnGapThreshold = 2; // You may need to adjust this based on actual PDF layout

  // Sort boxes by 'x' and then 'y'
  boxes.sort((a, b) => a.x - b.x || a.y - b.y);

  // Detect columns based on large gaps in 'x' values
  let columns = [];
  let lastX = 0;
  for (let i = 1; i < boxes.length; i++) {
    if (boxes[i].x - (boxes[i - 1].x + boxes[i - 1].w) > columnGapThreshold) {
      columns.push([lastX, boxes[i - 1].x + boxes[i - 1].w]);
      lastX = boxes[i].x;
    }
  }
  columns.push([lastX, Infinity]);

  // Extract text from each column
  let columnTexts = columns.map(([startX, endX]) => {
    let columnBoxes = boxes.filter(
      (box) => box.x >= startX && box.x + box.w <= endX,
    );
    columnBoxes.sort((a, b) => a.y - b.y || a.x - b.x);

    let columnResult = "";
    let prevBox = null;
    for (let box of columnBoxes) {
      if (prevBox) {
        if (Math.abs(box.y - prevBox.y) > yThreshold) {
          columnResult += "\n";
        } else if (box.x <= prevBox.x + prevBox.w + xThreshold) {
          columnResult += " ";
        }
      }
      columnResult += decodeURIComponent(box.R[0].T);
      prevBox = box;
    }
    return columnResult;
  });

  return columnTexts.join("\n\n"); // Separate columns with two new lines
}

// Example usage
const pdfTexts = [
  // ... your array of text boxes
];

console.log(extractTextFromPDFBoxes(pdfTexts));

export function extractTextFromPDFBoxes(boxes) {
  // Thresholds for determining proximity of boxes
  const yThreshold = 1; // vertical distance to determine a new line
  const xThreshold = 1; // horizontal distance to determine if boxes are next to each other

  // Sort boxes by 'y' and then 'x'
  // boxes.sort((a, b) => {
  //   if (a.y === b.y) {
  //     return a.x - b.x;
  //   }
  //   return a.y - b.y;
  // });

  let textResult = "";
  let prevBox = null;

  for (let box of boxes) {
    // If there's a previous box
    if (prevBox) {
      // Check if the current box is on a new line
      if (Math.abs(box.y - prevBox.y) > yThreshold) {
        textResult += "\n";
      } else if (box.x <= prevBox.x + prevBox.w + xThreshold) {
        textResult += " ";
      }
    }
    // Decode the URL-encoded text and add it to the result
    textResult += decodeURIComponent(box.R[0].T);
    prevBox = box;
  }

  return textResult;
}

function simplifyTextBoxes(boxes) {
  // Create a map of font size occurrences
  let fontSizeOccurrences = {};
  boxes.forEach((box) => {
    let size = box.R[0].TS[1];
    fontSizeOccurrences[size] = (fontSizeOccurrences[size] || 0) + 1;
  });

  // Identify the most commonly occurring font size
  let mostCommonSize = Object.keys(fontSizeOccurrences).reduce((a, b) =>
    fontSizeOccurrences[a] > fontSizeOccurrences[b] ? a : b,
  );
  let fontSizeMap = {};
  fontSizeMap[mostCommonSize] = "body";

  // Sort the other font sizes in descending order for headings
  let otherSizes = Object.keys(fontSizeOccurrences)
    .filter((size) => size !== mostCommonSize)
    .sort((a, b) => b - a);
  const textTypes = ["H1", "H2", "H3", "H4", "H5", "H6"];
  otherSizes.forEach((size, index) => {
    fontSizeMap[size] = textTypes[index];
  });

  // Create simplified boxes
  let simplifiedBoxes = boxes.map((box) => {
    let decodedText = decodeURIComponent(box.R[0].T);
    let type = fontSizeMap[box.R[0].TS[1]];

    return {
      x: box.x,
      y: box.y,
      w: box.w,
      text: decodedText,
      type: type,
    };
  });

  return simplifiedBoxes;
}

export async function extractDataFromPdf(pdfPath) {
  return new Promise((resolve, reject) => {
    const pdfParser = new PDFParser();

    pdfParser.on("pdfParser_dataError", (errData) =>
      console.error(errData.parserError),
    );
    pdfParser.on("pdfParser_dataReady", (pdfData) => {
      const pageTexts = pdfData.Pages.map((page) => {
        return extractTextFromPDFBoxes(page.Texts);
      });

      resolve({ pdfData, pageTexts });
    });

    pdfParser.loadPDF(pdfPath);
  });
}
