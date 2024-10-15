import {v2 as cloudinary} from 'cloudinary';
import fs from 'fs';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

 
const uploadOnCloudinary=async function(localFilepath){
    try{
    if (!localFilepath) return null;

    console.log("Uploading file: ",localFilepath);

    const response=await cloudinary.uploader.upload(localFilepath,{
        resource_type: 'auto'
    });
    console.log('File successfully uploaded on cloudinary',response.url);
    fs.unlinkSync(localFilepath);
    return response;

   }catch(error){
    fs.unlinkSync(localFilepath);
    console.log("Failed to upload on cloudinary: ",error);
   }
}

const deleteFromCloudinary = async function(Url, Options = {}) {
    try {
        const urlString = String(Url);
        if (!urlString) {
            return "Old URL not provided properly.";
        }

        const publicId = urlString.split('/').pop().split('.')[0];

        console.log('Public id for cloudinary is:', publicId);

        const response = await cloudinary.uploader.destroy(publicId, {
            resource_type: Options.resource_type || 'image'
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