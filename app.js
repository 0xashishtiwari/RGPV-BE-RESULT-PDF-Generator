import main from './pdf/generatepdf.js'

const startRoll = "0133CI22XXXX";
const endRoll = "0133CI22XXXX";
const semester = "6";

(async () => {
  await main(startRoll, endRoll, semester);
})();
