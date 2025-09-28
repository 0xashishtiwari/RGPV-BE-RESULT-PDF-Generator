import main from './pdf/generatepdf.js'

const startRoll = "0105CS221XXX";
const endRoll = "0105CS221XXX";
const semester = "6";

(async () => {
  await main(startRoll, endRoll, semester);
})();
