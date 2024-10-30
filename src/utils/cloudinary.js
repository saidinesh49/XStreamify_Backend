import {v2 as cloudinary} from 'cloudinary';
import fs from 'fs';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

 
const uploadOnCloudinary = async function(localFilepath, isThumbnail = false) {
    try {
        if (!localFilepath) return null;

        console.log("Uploading file: ", localFilepath);

        const options = {
            resource_type: isThumbnail ? 'image' : 'video',
            media_metadata: isThumbnail ? false : true,
        };

        const response = await cloudinary.uploader.upload(localFilepath, options);

        console.log('File successfully uploaded on Cloudinary:', response.secure_url);

        // Clean up local file
        fs.unlinkSync(localFilepath);

        // Return relevant response

        return response;

    } catch (error) {
        console.log("Failed to upload on Cloudinary: ", error);
        fs.unlinkSync(localFilepath); // Ensure the file is deleted even on error
        throw new Error("Upload failed");
    }
};


const deleteFromCloudinary = async function(Url, Options = {}) {
    try {
        const urlString = String(Url);
        if (!urlString) {
            return "Old URL not provided properly.";
        }

        const publicId = urlString.split('/').pop().split('.')[0];

        console.log('Public id for cloudinary is:', publicId);

        const response = await cloudinary.uploader.destroy(publicId, {
            resource_type: Options?.resource_type || 'video'
        });
        
        return response;
    } catch (error) {
        console.log(error.status || 500, error.message || 'Error while deleting from Cloudinary server');
        return "Old avatar not deleted from Cloudinary server";
    }
}


export {
    uploadOnCloudinary,
    deleteFromCloudinary
};