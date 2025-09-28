import Jimp from 'jimp'

const imageEnhancer = async (captchaBuffer) => {
  try {
    const image = await Jimp.read(captchaBuffer); // buffer se read
    image
      .grayscale()      
      .contrast(1)      
      .brightness(0.1); 
    const enhancedBuffer = await image.getBufferAsync(Jimp.MIME_PNG);
    return enhancedBuffer;
  } catch (error) {
    console.error("Image enhance error:", error);
    return null; // important: avoid downstream crash
  }
}

export default imageEnhancer;
