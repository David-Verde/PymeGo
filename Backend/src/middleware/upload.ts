// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { config } from '../config/config';

// Configurar Cloudinary
cloudinary.config({
    cloud_name: config.cloudinary.cloudName,
    api_key: config.cloudinary.apiKey,
    api_secret: config.cloudinary.apiSecret,
});


const storage = multer.memoryStorage();
export const upload = multer({ storage });


export const uploadToCloudinary = (fileBuffer: Buffer): Promise<string> => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            { resource_type: 'image', folder: 'logos' }, 
            (error, result) => {
                if (error) {
                    return reject(error);
                }
                if (!result) {
                    return reject(new Error('Cloudinary upload failed'));
                }
                resolve(result.secure_url);
            }
        );
        uploadStream.end(fileBuffer);
    });
};