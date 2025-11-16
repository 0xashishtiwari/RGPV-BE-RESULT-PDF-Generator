import chalk from "chalk";
import create from "../result/browser.js";
import fs from "fs";
import PDFDocument from "pdfkit";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let semval = 0;

// ---------------------------------------------------
// Generate roll numbers
// ---------------------------------------------------
function generateRollNumbers(startRoll, endRoll) {
  const prefix = startRoll.slice(0, -3);
  const startNum = parseInt(startRoll.slice(-3));
  const endNum = parseInt(endRoll.slice(-3));

  const rolls = [];
  for (let i = startNum; i <= endNum; i++) {
    rolls.push(prefix + i.toString().padStart(3, "0"));
  }
  return rolls;
}

// ---------------------------------------------------
// Generate PDF
// ---------------------------------------------------
async function generateSpreadsheetPDF(allStudents, filePath) {
  const doc = new PDFDocument({
    margin: 36,
    size: "A4",
    layout: "landscape",
  });

  const stream = fs.createWriteStream(filePath);
  doc.pipe(stream);

  // Title
  doc
    .fontSize(26)
    .font("Helvetica-BoldOblique")
    .fillColor("#003366")
    .text(`RGPV ${semval}th Semester Results`, {
      align: "center",
      underline: true,
      lineGap: 6,
    });

  const allSubjectsSet = new Set();
  allStudents.forEach((stu) =>
    stu.subjects.forEach((sub) => allSubjectsSet.add(sub.code))
  );
  const allSubjects = Array.from(allSubjectsSet);

  const columns = ["Roll No", "Name", ...allSubjects, "Result", "SGPA", "CGPA"];

  const tableMargin = 10;
  const pageWidth = doc.page.width - tableMargin * 2;

  const rollNoWidth = 70;
  const nameWidth = 120;
  const otherWidth =
    (pageWidth - rollNoWidth - nameWidth) / (columns.length - 2);

  const startX = tableMargin;
  let y = doc.y;
  const rowHeight = 20;

  function drawHeader() {
    doc.font("Helvetica-Bold").fontSize(8);
    columns.forEach((col, i) => {
      const colWidth =
        i === 0 ? rollNoWidth : i === 1 ? nameWidth : otherWidth;

      const colX =
        startX +
        columns.slice(0, i).reduce((acc, c, j) => {
          if (j === 0) return acc + rollNoWidth;
          if (j === 1) return acc + nameWidth;
          return acc + otherWidth;
        }, 0);

      doc.rect(colX, y, colWidth, rowHeight).stroke();
      doc.text(col, colX, y + 5, { width: colWidth, align: "center" });
    });
    y += rowHeight;
    doc.font("Helvetica").fontSize(7);
  }

  drawHeader();

  allStudents.forEach((stu, idx) => {
    if (idx % 2 === 0) {
      doc.rect(startX, y, pageWidth, rowHeight).fill("#f5f5f5").stroke();
      doc.fillColor("black");
    }

    columns.forEach((col, i) => {
      const colWidth =
        i === 0 ? rollNoWidth : i === 1 ? nameWidth : otherWidth;

      const colX =
        startX +
        columns.slice(0, i).reduce((acc, c, j) => {
          if (j === 0) return acc + rollNoWidth;
          if (j === 1) return acc + nameWidth;
          return acc + otherWidth;
        }, 0);

      let text = "-";
      if (col === "Roll No") text = stu.rollNo || "-";
      else if (col === "Name") text = stu.name || "-";
      else if (col === "Result") text = stu.result || "-";
      else if (col === "SGPA") text = stu.sgpa || "-";
      else if (col === "CGPA") text = stu.cgpa || "-";
      else {
        const sub = stu.subjects?.find((s) => s.code === col);
        text = sub ? sub.grade : "-";
      }

      doc.rect(colX, y, colWidth, rowHeight).stroke();

      if (col === "Name") {
        doc.text(text, colX + 2, y + 5, {
          width: colWidth - 4,
          ellipsis: true,
        });
      } else {
        doc.text(text, colX, y + 5, { width: colWidth, align: "center" });
      }
    });

    y += rowHeight;

    if (y > doc.page.height - doc.page.margins.bottom - rowHeight) {
      doc.addPage();
      y = doc.page.margins.top;
      drawHeader();
    }
  });

  doc.end();

  return new Promise((resolve, reject) => {
    stream.on("finish", resolve);
    stream.on("error", reject);
  });
}

// ---------------------------------------------------
// MAIN FUNCTION WITH LIVE STATUS (NO EMOJIS)
// ---------------------------------------------------
async function main(startRoll, endRoll, semester, socket) {
  semval = semester;
  const rolls = generateRollNumbers(startRoll, endRoll);
  const allStudents = [];

  for (const roll of rolls) {
    if (socket) socket.emit("status", `Fetching ${roll}`);

    try {
      const data = await create(roll, semester);

      if (!data || !data.name) {
        if (socket) socket.emit("status", `No data for ${roll}`);
        allStudents.push({
          rollNo: roll,
          subjects: [],
          result: "-",
          sgpa: "-",
          cgpa: "-",
        });
      } else {
        if (socket) socket.emit("status", `Completed ${roll}`);
        allStudents.push(data);
      }

    } catch {
      if (socket) socket.emit("status", `Failed ${roll}`);
      allStudents.push({
        rollNo: roll,
        subjects: [],
        result: "-",
        sgpa: "-",
        cgpa: "-",
      });
    }
  }

  if (socket) socket.emit("status", "Writing PDF...");

  const outputDir = path.join(__dirname, "output");
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

  const id = crypto.randomUUID();
  const outputPath = path.join(
    outputDir,
    `Results_${semester}_Semester_${id}.pdf`
  );

  await generateSpreadsheetPDF(allStudents, outputPath);

  if (socket) socket.emit("status", "PDF Completed");

  return outputPath;
}

export default main;
