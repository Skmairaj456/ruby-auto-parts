// const cloudinary = require('./cloudinary'); // Commented out - not needed for local printing
const bwipjs = require('bwip-js');

const generateBarcodeAndUpload = async (data) => {
  try {
    // Generate barcode as PNG buffer
    const barcodeImageBuffer = await bwipjs.toBuffer({
      bcid: 'code128',        // Barcode type: Code 128
      text: data,             // Text to encode
      scale: 2,               // Scaling factor (reduced for 2-inch labels)
      height: 8,              // Bar height, in millimeters (reduced for 2-inch labels)
      includetext: true,      // Show human-readable text
      textxalign: 'center',   // Text alignment
    });

    // Convert buffer to base64 data URL for local use
    const base64String = barcodeImageBuffer.toString('base64');
    const dataUrl = `data:image/png;base64,${base64String}`;
    
    return dataUrl; // Return data URL instead of Cloudinary URL
  } catch (error) {
    console.error('Error generating barcode:', error);
    throw new Error('Failed to generate barcode.');
  }
};

module.exports = { generateBarcodeAndUpload };