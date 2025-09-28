Here’s a concise, clean, GitHub-friendly **README.md** for your repo:

````markdown
# RGPV Result PDF Generator

A Node.js script to fetch RGPV semester results and generate a **PDF spreadsheet** with:

- Roll Number  
- Subjects & Grades  
- SGPA & CGPA  

Missing results are marked as `-`.

---

## Features

- Automatic result fetching using **Puppeteer**  
- CAPTCHA solved with **Tesseract OCR**  
- Generates a clean, well-formatted PDF  
- Handles multiple students between a start and end roll number  

---

## Usage

1. Clone the repo:

```bash
git clone <your-repo-url>
cd <repo-folder>
````

2. Install dependencies:

```bash
npm install
```

3. Open `app.js` and set:

```js
const startRoll = "0105CS221001";
const endRoll = "0105CS221010";
const semester = "6";
```

4. Run the script:

```bash
node app.js
```

5. PDF will be saved in the **root directory** as `Results_<semester>_Semester.pdf`.

---

## Notes

* A real browser is used by default (can enable headless mode in `browser.js`)
* Tesseract OCR is used for solving CAPTCHA
* Requires active internet connection

---

## Dependencies

* [Puppeteer](https://www.npmjs.com/package/puppeteer)
* [PDFKit](https://www.npmjs.com/package/pdfkit)
* [Tesseract.js](https://www.npmjs.com/package/tesseract.js)

---

## License

Open source and free to use.


