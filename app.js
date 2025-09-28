import main from './pdf/generatepdf.js'

const startRoll = "0105CS231XXX";
const endRoll = "0105CS231XXX";
const semester = "6";

(async () => {
  await main(startRoll, endRoll, semester);
})();
