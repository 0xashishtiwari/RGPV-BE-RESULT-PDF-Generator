import create from "../result/browser.js";
import fs from "fs";
import PDFDocument from "pdfkit";

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

async function generateSpreadsheetPDF(allStudents, filePath) {
  const margin = 0.1; // 0.1 inch in points
  const doc = new PDFDocument({ margin: margin, size: "A4", layout: "portrait" });
  doc.pipe(fs.createWriteStream(filePath));

  // Title
  doc.fontSize(18).font("Helvetica-Bold").text("RGPV Semester Results", { align: "center" });
  doc.moveDown(1.5);

  // Collect all unique subjects
  const allSubjectsSet = new Set();
  allStudents.forEach((stu) => stu.subjects.forEach((sub) => allSubjectsSet.add(sub.code)));
  const allSubjects = Array.from(allSubjectsSet);

  const columns = ["Roll No", ...allSubjects, "Result", "SGPA", "CGPA"];
  const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const colWidth = pageWidth / columns.length; // dynamic width
  const startX = doc.page.margins.left;
  let y = 50;
  const rowHeight = 18;

  function drawHeader() {
    doc.rect(startX - 1, y - 1, colWidth * columns.length + 2, rowHeight + 2)
      .fill("#d3d3d3").stroke();
    doc.fillColor("black").fontSize(8).font("Helvetica-Bold");
    columns.forEach((col, i) => {
      doc.text(col, startX + i * colWidth, y, { width: colWidth, align: "center", ellipsis: true });
    });
    y += rowHeight;
    doc.font("Helvetica").fontSize(8);
  }

  drawHeader();

  allStudents.forEach((stu, idx) => {
    if (idx % 2 === 0)
      doc.rect(startX - 1, y - 1, colWidth * columns.length + 2, rowHeight)
        .fill("#f9f9f9").stroke();
    doc.fillColor("black");

    doc.text(stu.rollNo || "-", startX + 0 * colWidth, y, { width: colWidth, align: "center" });

    allSubjects.forEach((subCode, i) => {
      const sub = stu.subjects ? stu.subjects.find((s) => s.code === subCode) : null;
      const grade = sub ? sub.grade : "-";
      doc.text(grade, startX + (i + 1) * colWidth, y, { width: colWidth, align: "center" });
    });

    doc.text(stu.result || "-", startX + (allSubjects.length + 1) * colWidth, y, { width: colWidth, align: "center" });
    doc.text(stu.sgpa || "-", startX + (allSubjects.length + 2) * colWidth, y, { width: colWidth, align: "center" });
    doc.text(stu.cgpa || "-", startX + (allSubjects.length + 3) * colWidth, y, { width: colWidth, align: "center" });

    y += rowHeight;

    // Page break
    if (y > doc.page.height - doc.page.margins.bottom - rowHeight) {
      doc.addPage();
      y = doc.page.margins.top;
      drawHeader();
    }
  });

  doc.end();
  console.log(`Spreadsheet PDF saved to ${filePath}`);
}

async function main(startRoll, endRoll, semester) {
  const studentsRolls = generateRollNumbers(startRoll, endRoll);
  const allStudents = [];

  for (const roll of studentsRolls) {
    console.log("Fetching:", roll);
    try {
      const data = await create(roll, semester);
      if (!data || !data.name) {
        allStudents.push({
          rollNo: roll,
          subjects: [],
          result: "-",
          sgpa: "-",
          cgpa: "-"
        });
      } else {
        allStudents.push(data);
      }
    } catch (err) {
      console.log("Failed to fetch data for", roll, err);
      allStudents.push({
        rollNo: roll,
        subjects: [],
        result: "-",
        sgpa: "-",
        cgpa: "-"
      });
    }
  }

  await generateSpreadsheetPDF(allStudents, `Results_${semester}_Semester.pdf`);
}


export default main;
