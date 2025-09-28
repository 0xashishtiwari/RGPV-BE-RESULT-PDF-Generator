import puppeteer from 'puppeteer'
import solveCaptcha from './captcha-solver.js'
import imageEnhancer from './image-enhancer.js'



const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const create = async (enrollmentNumber, semester) => {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      defaultViewport: null,
      args: ["--start-maximized"],
    });

    const page = await browser.newPage();

    let alertDetected = false;

    page.on("dialog", async (dialog) => {
      console.log("Alert detected:", dialog.message());
      if (dialog.message().includes("Result for this Enrollment No. not Found")) {
        alertDetected = true;
        await dialog.accept();
        console.log("Result not found alert closed.");
        console.log("Browser closed.");
        browser.close();
      } else {
        await dialog.accept();
        console.log("Other alert closed");
      }
    });

    await page.goto("https://result.rgpv.ac.in/Result/ProgramSelect.aspx", {
      waitUntil: "networkidle2",
    });
    // await delay(1000);

    await page.click('label[for="radlstProgram_1"]');
    await delay(1000);

    const rollNoSelector = "#ctl00_ContentPlaceHolder1_txtrollno";
    await page.focus(rollNoSelector);
    await page.click(rollNoSelector, { clickCount: 3 });
    await page.keyboard.press("Backspace");
    await page.type(rollNoSelector, enrollmentNumber);
    await page.select("#ctl00_ContentPlaceHolder1_drpSemester", semester);
    await delay(1000);

    const captchaSelector = 'img[src^="CaptchaImage.axd"]';
    const captchaInputSelector = "#ctl00_ContentPlaceHolder1_TextBox1";

    let finalData = {};
    const maxAttempts = 8;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      if (alertDetected) return null;

      console.log(`\nCaptcha Attempt ${attempt}`);
      await page.waitForSelector(captchaSelector, { visible: true, timeout: 10000 });
      const captchaElement = await page.$(captchaSelector);
      const captchaBuffer = await captchaElement.screenshot();
      const enhancedImage = await imageEnhancer(captchaBuffer);
      let captchaValue = await solveCaptcha(enhancedImage);
      captchaValue = captchaValue.replace(/\s+/g, "");
      console.log("OCR Captcha:", captchaValue);

      await page.focus(captchaInputSelector);
      await page.click(captchaInputSelector, { clickCount: 3 });
      await page.keyboard.press("Backspace");
      await page.type(captchaInputSelector, captchaValue);
    //   await delay(1000);

      const viewState = await page.$eval("#__VIEWSTATE", el => el.value);
      const eventValidation = await page.$eval("#__EVENTVALIDATION", el => el.value);
      const viewStateGenerator = await page.$eval("#__VIEWSTATEGENERATOR", el => el.value);

      await page.evaluate((vs, ev, vsg, captcha) => {
        document.querySelector("#__VIEWSTATE").value = vs;
        document.querySelector("#__EVENTVALIDATION").value = ev;
        document.querySelector("#__VIEWSTATEGENERATOR").value = vsg;
        document.querySelector("#ctl00_ContentPlaceHolder1_TextBox1").value = captcha;
        __doPostBack("ctl00$ContentPlaceHolder1$btnviewresult", "");
      }, viewState, eventValidation, viewStateGenerator, captchaValue);

    //   await delay(2000);

      if (alertDetected) return null;

      try {
        await page.waitForSelector("#ctl00_ContentPlaceHolder1_lblNameGrading", { timeout: 5000 });

        finalData = await page.evaluate(() => {
          const getText = (id) => document.querySelector(id)?.innerText.trim() || "";

          const subjectTables = Array.from(
            document.querySelectorAll("#ctl00_ContentPlaceHolder1_pnlGrading table.gridtable")
          ).filter((tbl) => tbl.querySelectorAll("tr:first-child td").length === 4);

          const subjects = [];
          subjectTables.forEach((tbl) => {
            const rows = Array.from(tbl.querySelectorAll("tr"));
            rows.forEach((row) => {
              const tds = row.querySelectorAll("td");
              if (tds.length === 4) {
                subjects.push({
                  code: tds[0]?.innerText.trim(),
                  totalCredit: tds[1]?.innerText.trim(),
                  earnedCredit: tds[2]?.innerText.trim(),
                  grade: tds[3]?.innerText.trim(),
                });
              }
            });
          });

          return {
            name: getText("#ctl00_ContentPlaceHolder1_lblNameGrading"),
            rollNo: getText("#ctl00_ContentPlaceHolder1_lblRollNoGrading"),
            course: getText("#ctl00_ContentPlaceHolder1_lblProgramGrading"),
            branch: getText("#ctl00_ContentPlaceHolder1_lblBranchGrading"),
            semester: getText("#ctl00_ContentPlaceHolder1_lblSemesterGrading"),
            status: getText("#ctl00_ContentPlaceHolder1_lblStatusGrading"),
            subjects,
            result: getText("#ctl00_ContentPlaceHolder1_lblResultNewGrading"),
            sgpa: getText("#ctl00_ContentPlaceHolder1_lblSGPA"),
            cgpa: getText("#ctl00_ContentPlaceHolder1_lblcgpa"),
          };
        });

        break;
      } catch (err) {
        console.log("Captcha wrong or timeout, retrying...");
        await delay(200);
      }
    }

    // console.log("\nFinal Data:", finalData);
    return finalData;

  } catch (error) {
    console.error("Error occurred:", error);
    return null;
  } finally {
    if (browser) {
      await browser.close();
      console.log("Browser closed.");
    }
  }
};

export default create;
