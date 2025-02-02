import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
	cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
	api_key: process.env.CLOUDINARY_API_KEY,
	api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async function (localFilepath, isThumbnail = false) {
	try {
		if (!localFilepath) return null;

		console.log("Uploading file: ", localFilepath);

		const options = {
			resource_type: "auto",
			allowedFormats: ["jpg", "png", "gif", "jpeg", "mp4"],
		};

		const response = await cloudinary.uploader.upload(localFilepath, options);

		console.log(
			"File successfully uploaded on Cloudinary:",
			response?.secure_url,
		);

		// Clean up local file
		fs.unlinkSync(localFilepath);

		// Return relevant response

		return response;
	} catch (error) {
		fs.unlinkSync(localFilepath); // Ensure the file is deleted even on error
		console.log("Failed to upload on Cloudinary: ", error);
		throw new Error("Upload failed");
	}
};

const deleteFromCloudinary = async (publicId, options = {}) => {
	try {
		const result = await cloudinary.uploader.destroy(publicId, options);
		return result;
	} catch (error) {
		console.error("Error deleting from Cloudinary:", error);
		throw new Error("Failed to delete from Cloudinary");
	}
};

export { uploadOnCloudinary, deleteFromCloudinary };
