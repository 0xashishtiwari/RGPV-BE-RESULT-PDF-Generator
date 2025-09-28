import Tesseract from 'tesseract.js'


async function solveCaptcha(captchaBuffer) {
  try {
    const { data: { text } } = await Tesseract.recognize(
    //   path.join(__dirname, 'image.png'),
    captchaBuffer,
      'eng'
    );
    const value = text.trim().replace(/\s+/g, '').toLocaleLowerCase();

    console.log("OCR Result:", value);
    return value;
  } catch (err) {
    console.error(err);
    return null;
  }
}

export default solveCaptcha;

// call karna
// (async () => {
//   const captchaValue = await solveCaptcha();
//   console.log(captchaValue); // ab properly mil jayega
// })();
