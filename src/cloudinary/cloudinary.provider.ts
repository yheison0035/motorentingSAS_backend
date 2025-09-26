import { v2 as cloudinary } from 'cloudinary';

export const CloudinaryProvider = {
  provide: 'CLOUDINARY',
  useFactory: () => {
    cloudinary.config({
      CLOUDINARY_URL: process.env.CLOUDINARY_URL,
    });
    return cloudinary;
  },
};
