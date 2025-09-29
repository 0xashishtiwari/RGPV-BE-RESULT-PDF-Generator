import chalk from "chalk";
import create from "../result/browser.js";
import fs from "fs";
import PDFDocument from "pdfkit";
let semval =0;
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
  const doc = new PDFDocument({ margin: 36, size: "A4", layout: "landscape" });
  doc.pipe(fs.createWriteStream(filePath));

  // Title
doc
  .fontSize(26) // bigger and more prominent
  .font("Helvetica-BoldOblique") // stylish bold font
  .fillColor("#003366") // professional dark blue color
  .text(`RGPV ${semval}th Semester Results`, {
    align: "center",
    underline: true,
    lineGap: 6, // spacing between underline and text
  });

// doc.moveDown(0.5); // more space below the title


  // Collect all unique subjects
  const allSubjectsSet = new Set();
  allStudents.forEach((stu) =>
    stu.subjects.forEach((sub) => allSubjectsSet.add(sub.code))
  );
  const allSubjects = Array.from(allSubjectsSet);

  // Add Name column
  const columns = ["Roll No", "Name", ...allSubjects, "Result", "SGPA", "CGPA"];

  // Table margins (smaller than document margin)
  const tableMargin = 10;
  const pageWidth = doc.page.width - tableMargin * 2;

  // Column widths
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
        columns.slice(0, i).reduce((a, c, j) => {
          if (j === 0) return a + rollNoWidth;
          if (j === 1) return a + nameWidth;
          return a + otherWidth;
        }, 0);

      doc.rect(colX, y, colWidth, rowHeight).stroke();
      doc.text(col, colX, y + 5, { width: colWidth, align: "center" });
    });
    y += rowHeight;
    doc.font("Helvetica").fontSize(7);
  }

  drawHeader();

  allStudents.forEach((stu, idx) => {
    // Zebra row
    if (idx % 2 === 0) {
      doc.rect(startX, y, pageWidth, rowHeight).fill("#f5f5f5").stroke();
      doc.fillColor("black");
    }

    columns.forEach((col, i) => {
      const colWidth =
        i === 0 ? rollNoWidth : i === 1 ? nameWidth : otherWidth;

      const colX =
        startX +
        columns.slice(0, i).reduce((a, c, j) => {
          if (j === 0) return a + rollNoWidth;
          if (j === 1) return a + nameWidth;
          return a + otherWidth;
        }, 0);

      let text = "-";
      if (col === "Roll No") text = stu.rollNo || "-";
      else if (col === "Name") text = stu.name || "-";
      else if (col === "Result") text = stu.result || "-";
      else if (col === "SGPA") text = stu.sgpa || "-";
      else if (col === "CGPA") text = stu.cgpa || "-";
      else {
        const sub = stu.subjects
          ? stu.subjects.find((s) => s.code === col)
          : null;
        text = sub ? sub.grade : "-";
      }

      doc.rect(colX, y, colWidth, rowHeight).stroke();
      // Prevent wrapping for Name column
      if (col === "Name") {
        doc.text(text, colX + 2, y + 5, {
          width: colWidth - 4,
          ellipsis: true, // cut off with "..." if too long
        });
      } else {
        doc.text(text, colX, y + 5, { width: colWidth, align: "center" });
      }
    });

    y += rowHeight;

    // Page break
    if (y > doc.page.height - doc.page.margins.bottom - rowHeight) {
      doc.addPage();
      y = doc.page.margins.top;
      drawHeader();
    }
  });

  doc.end();
  console.log(chalk.greenBright(`Spreadsheet PDF saved to ${filePath}`));
}


async function main(startRoll, endRoll, semester) {
  semval = semester;
  const studentsRolls = generateRollNumbers(startRoll, endRoll);
  const allStudents = [];

  for (const roll of studentsRolls) {
    console.log(chalk.yellow("Fetching:", roll));
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
      console.log(chalk.red("Failed to fetch data for", roll, err));
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
