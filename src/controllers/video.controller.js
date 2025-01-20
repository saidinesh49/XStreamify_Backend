import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
	deleteFromCloudinary,
	uploadOnCloudinary,
} from "../utils/cloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {
	const {
		page = 1,
		limit = 10,
		query,
		sortBy = "createdAt",
		sortType = "desc",
		userId,
	} = req.query;

	// Convert pagination params to numbers
	const pageNumber = parseInt(page, 10);
	const limitNumber = parseInt(limit, 10);

	// Calculate the offset for pagination
	const skip = (pageNumber - 1) * limitNumber;

	// Build the query object
	const filter = {};
	if (query) {
		filter.$or = [
			{ title: { $regex: query, $options: "i" } }, // Case-insensitive title search
			{ description: { $regex: query, $options: "i" } }, // Case-insensitive description search
		];
	}
	if (userId) {
		filter.owner = userId; // Filter by user ID if provided
	}

	// Build the sort object
	const sortOptions = {};
	sortOptions[sortBy] = sortType === "desc" ? -1 : 1;

	// Fetch videos with filtering, sorting, and pagination
	const videos = await Video.find(filter)
		.sort(sortOptions)
		.skip(skip)
		.limit(limitNumber)
		.populate("owner", "username") // Optionally populate owner details
		.exec();

	// Get total count of videos for pagination
	const totalCount = await Video.countDocuments(filter).exec();

	return res.status(200).json(
		new ApiResponse(
			200,
			{
				totalCount,
				videos,
				currentPage: pageNumber,
				totalPages: Math.ceil(totalCount / limitNumber),
			},
			"Videos fetched successfully",
		),
	);
});

const publishAVideo = asyncHandler(async (req, res) => {
	const { title, description } = req.body;

	if (!title || !description) {
		throw new ApiError(400, "Title and description are required");
	}

	const videoLocalPath = req.files?.videoFile[0]?.path || "";
	const thumbnailLocalPath = req.files?.thumbnail[0]?.path || "";

	// console.log("req.files.videoFile is: ", req.files?.videoFile[0].path);

	if (!videoLocalPath) {
		throw new ApiError(400, "Video file is missing");
	}

	const video = await uploadOnCloudinary(videoLocalPath);
	if (!video) {
		throw new ApiError(400, "Failed to upload video to Cloudinary");
	}
	const videoUrl = video?.secure_url;

	var thumbnailUrl = null;
	if (thumbnailLocalPath) {
		const thumbnail = await uploadOnCloudinary(thumbnailLocalPath, true);
		if (!thumbnail) {
			throw new ApiError(400, "Failed to upload thumbnail to Cloudinary");
		}
		thumbnailUrl = thumbnail?.secure_url;
	}

	console.log(
		"Urls after video and thumbnail uplaoding.. ",
		videoUrl,
		" and ",
		thumbnailUrl,
		" and ",
		req.user?.username,
	);

	const videoDetails = await Video.create({
		videoFile: videoUrl,
		thumbnail: thumbnailUrl,
		title: title,
		description: description,
		duration: video.duration,
		owner: req.user?._id,
		username: req.user?.username,
	});

	return res
		.status(200)
		.json(new ApiResponse(200, videoDetails, "Video uploaded successfully"));
});

const getVideoById = asyncHandler(async (req, res) => {
	const { videoId } = req.params;
	//TODO: get video by id
	if (!isValidObjectId(videoId)) {
		throw new ApiError(400, "Invalid video ID");
	}
	const video = await Video.findById(videoId);
	if (!video) {
		throw new ApiError(404, "Video not found");
	}
	return res
		.status(200)
		.json(new ApiResponse(200, video, "Video fetched successfully"));
});

const updateVideo = asyncHandler(async (req, res) => {
	const { videoId } = req.params;
	//TODO: update video details like title, description, thumbnail
	const { title, description } = req.body;
	const thumbnailLocalPath = req.file?.path || "";
	if (thumbnailLocalPath) {
		const video = await Video.findById(videoId).select("thumbnail");

		if (!video.thumbnail) {
			throw new ApiError(400, "Video not found");
		}

		const thumbnail = await uploadOnCloudinary(thumbnailLocalPath, true);

		if (!thumbnail) {
			throw new ApiError(400, "Failed to upload thumbnail to cloudinary");
		}

		const updateVideo = await Video.findByIdAndUpdate(
			videoId,
			{
				$set: {
					title: title,
					description: description,
					thumbnail: thumbnail.url,
				},
			},
			{ new: true },
		);

		if (!updateVideo) {
			throw new ApiError(400, "Failed to update video");
		}

		const deletePrevThumbnail = await deleteFromCloudinary(video.thumbnail, {
			resourse_type: "image",
		});

		if (!deletePrevThumbnail) {
			throw new ApiError(
				400,
				"Failed to delete previous thumbnail from cloudinary",
			);
		}

		return res
			.status(200)
			.json(new ApiResponse(200, updateVideo, "Video updated successfully"));
	}

	const updatedVideo = await Video.findByIdAndUpdate(
		videoId,
		{
			$set: {
				title: title,
				description: description,
			},
		},
		{ new: true },
	);

	return res
		.status(200)
		.json(new ApiResponse(200, updatedVideo, "Video updated successfully"));
});

const deleteVideo = asyncHandler(async (req, res) => {
	const { videoId } = req.params;

	if (!videoId) {
		throw new ApiError(400, "Video ID is required");
	}

	const video = await Video.findById(videoId).select("videoFile thumbnail");

	if (!video) {
		throw new ApiError(404, "Video not found");
	}

	// Delete video file and thumbnail if it exists
	const deletedVideoRes = await deleteFromCloudinary(video.videoFile);
	if (!deletedVideoRes) {
		throw new ApiError(500, "Error while deleting video from Cloudinary");
	}

	if (video.thumbnail) {
		await deleteFromCloudinary(video.thumbnail, { resource_type: "image" });
	}

	return res
		.status(200)
		.json(new ApiResponse(200, deletedVideoRes, "Video deleted successfully"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
	const { videoId } = req.params;
	if (!videoId) {
		throw new ApiError(401, "Video id is required");
	}
	const video = await Video.findById(videoId);

	if (!video) {
		throw new ApiError(404, "Video Not Found");
	}

	const updatedVideo = await Video.findByIdAndUpdate(
		videoId,
		{
			$set: {
				isPublished: !video.isPublished,
			},
		},
		{ new: true },
	);

	return res
		.status(200)
		.json(new ApiResponse(200, updatedVideo, "Video toggled successfully"));
});

export {
	getAllVideos,
	publishAVideo,
	getVideoById,
	updateVideo,
	deleteVideo,
	togglePublishStatus,
};
