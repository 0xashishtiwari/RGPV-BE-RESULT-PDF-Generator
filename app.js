import main from './pdf/generatepdf.js'

<<<<<<< HEAD
const startRoll = "0133CI22XXXX";
const endRoll = "0133CI22XXXX";
=======
const startRoll = "0105CS231XXX";
const endRoll = "0105CS231XXX";
>>>>>>> ca065f9e40833569ed47517dce974bde70b8cbb2
const semester = "6";

(async () => {
  await main(startRoll, endRoll, semester);
})();
