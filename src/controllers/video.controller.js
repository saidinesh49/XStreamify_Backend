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
import { deleteVideoComments } from "./comment.controller.js";
import { deleteVideoLikes } from "./like.controller.js";
import { Like } from "../models/like.model.js";
import { Comment } from "../models/comment.model.js";
import searchService from "../services/search.service.js";
import { Worker } from "worker_threads";

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
	const {
		title,
		description,
		videoUrl,
		duration,
		thumbnailUrl,
		tags = [],
	} = req.body;

	if (!title || !description || !videoUrl || !thumbnailUrl) {
		throw new ApiError(400, "Required fields are missing");
	}

	const videoDetails = await Video.create({
		videoFile: videoUrl,
		thumbnail: thumbnailUrl,
		title,
		description,
		duration,
		tags: tags.map((tag) => tag.toLowerCase()),
		owner: req.user?._id,
		username: req.user?.username,
	});

	// Add tags to search engine in the main thread
	tags.forEach((tag) => {
		searchService.addTerm(tag.toLowerCase());
	});

	return res
		.status(200)
		.json(new ApiResponse(200, videoDetails, "Video uploaded successfully"));
});

const getVideoById = asyncHandler(async (req, res) => {
	console.log("Received params at getVideoById is: ", req?.params);
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
	const { title, description, thumbnailUrl } = req.body;
	// const thumbnailLocalPath = req.file?.path || "";
	console.log("data recieved at backend is:", req.body);

	const oldDetailsOfVideo = await Video.findById(videoId).select(
		"thumbnail owner",
	);

	// const thumbnail = await uploadOnCloudinary(thumbnailLocalPath, true);

	// if (!thumbnail) {
	// 	throw new ApiError(400, "Failed to upload thumbnail to cloudinary");
	// }
	if (!oldDetailsOfVideo?.owner) {
		throw new ApiError(404, "Video not found");
	}

	const updatedVideo = await Video.findByIdAndUpdate(
		videoId,
		{
			$set: {
				title: title,
				description: description,
				thumbnail: thumbnailUrl || oldDetailsOfVideo?.thumbnail,
			},
		},
		{ new: true },
	);

	if (!updatedVideo) {
		throw new ApiError(400, "Failed to update video");
	}

	const deletePrevThumbnail = await deleteFromCloudinary(
		oldDetailsOfVideo?.thumbnail,
		{ resource_type: "image" },
	);
	console.log("Response of old thumbail deletion:", deletePrevThumbnail);
	if (!deletePrevThumbnail) {
		throw new ApiError(
			400,
			"Failed to delete previous thumbnail from cloudinary",
		);
	}

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

	// Extract public IDs from URLs
	const videoPublicId = video.videoFile.split("/").pop().split(".")[0];
	const thumbnailPublicId = video.thumbnail
		? video.thumbnail.split("/").pop().split(".")[0]
		: null;

	// Delete video file and thumbnail from Cloudinary
	const deletedVideoRes = await deleteFromCloudinary(videoPublicId, {
		resource_type: "video",
	});
	console.log(
		"deletedVideo response:",
		deletedVideoRes,
		"video public id:",
		videoPublicId,
	);
	if (!deletedVideoRes) {
		throw new ApiError(500, "Error while deleting video from Cloudinary");
	}

	if (thumbnailPublicId) {
		const thumbnailResponse = await deleteFromCloudinary(thumbnailPublicId, {
			resource_type: "image",
		});
		console.log("deletedThumbnail response:", thumbnailResponse);
	}

	// Delete all comments and likes associated with the video
	await Promise.all([
		Like.deleteMany({ video: videoId }),
		Comment.deleteMany({ video: videoId }),
	]);

	// Delete the video document itself
	await Video.findByIdAndDelete(videoId);

	return res
		.status(200)
		.json(
			new ApiResponse(
				200,
				{},
				"Video and associated data deleted successfully",
			),
		);
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
