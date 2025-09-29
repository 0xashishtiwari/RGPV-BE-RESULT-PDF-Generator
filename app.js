import main from './pdf/generatepdf.js'

const startRoll = "0105CS221001";
const endRoll = "0105CS221030";
const semester = "6";

(async () => {
  await main(startRoll, endRoll, semester);
})();
