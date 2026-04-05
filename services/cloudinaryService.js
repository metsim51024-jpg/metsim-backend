// backend/services/cloudinaryService.js
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadFile = async (fileBuffer, filename) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'auto',
        filename_override: filename,
        folder: 'metsim/quotes'
      },
      (error, result) => {
        if (error) {
          console.error('❌ Error Cloudinary:', error);
          reject(error);
        } else {
          console.log('✅ Archivo subido a Cloudinary:', filename);
          resolve(result);
        }
      }
    );

    stream.end(fileBuffer);
  });
};

module.exports = {
  uploadFile
};
