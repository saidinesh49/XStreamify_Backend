import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { request } from "express";

const toggleVideoLike = asyncHandler(async (req, res) => {
	const { videoId } = req.params;
	//TODO: toggle like on video
	if (!videoId) {
		throw new ApiError(401, "Video id is required");
	}

	const like = await Like.findOne({
		video: videoId,
		likedBy: req.user._id,
	});

	if (!like) {
		const newLike = await Like.create({
			video: videoId,
			likedBy: req.user._id,
		});

		if (!newLike) {
			throw new ApiError(500, "failed to create like for video");
		}

		return res
			.status(201)
			.json(new ApiResponse(201, newLike, "Liked successfully"));
	}

	await Like.deleteOne({ _id: like._id });

	return res
		.status(200)
		.json(new ApiResponse(200, null, "Unliked Successfully"));
});

const toggleCommentLike = asyncHandler(async (req, res) => {
	const { commentId } = req.params;
	//TODO: toggle like on comment
	if (!commentId) {
		throw new ApiError(401, "Comment id is required");
	}

	const like = await Like.findOne({
		comment: commentId,
		likedBy: req.user._id,
	});

	if (!like) {
		const newLike = await Like.create({
			comment: commentId,
			likedBy: req.user._id,
		});

		if (!newLike) {
			throw new ApiError(500, "failed to create like for comment");
		}

		return res
			.status(201)
			.json(new ApiResponse(201, newLike, "Liked successfully"));
	}

	await Like.deleteOne({ _id: like._id });

	return res
		.status(200)
		.json(new ApiResponse(200, null, "Unliked Successfully"));
});

const toggleTweetLike = asyncHandler(async (req, res) => {
	const { tweetId } = req.params;
	//TODO: toggle like on tweet
	if (!tweetId) {
		throw new ApiError(401, "Tweet id is required");
	}

	const like = await Like.findOne({
		tweet: tweetId,
		likedBy: req.user._id,
	});

	if (!like) {
		const newLike = await Like.create({
			tweet: tweetId,
			likedBy: req.user._id,
		});

		if (!newLike) {
			throw new ApiError(500, "failed to create like for tweet");
		}

		return res
			.status(201)
			.json(new ApiResponse(201, newLike, "Liked successfully"));
	}

	await Like.deleteOne({ _id: like._id });

	return res
		.status(200)
		.json(new ApiResponse(200, null, "Unliked Successfully"));
});

const getVideoLikes = asyncHandler(async (req, res) => {
	const { videoId } = req.params;
	if (!videoId) {
		throw new ApiError(401, "Video id is required");
	}

	const numberOfLikes = await Like.countDocuments({ video: videoId });

	return res
		.status(200)
		.json(
			new ApiResponse(
				200,
				{ numberOfLikes },
				"Number of likes fetched successfully",
			),
		);
});

const getCommentLikes = asyncHandler(async (req, res) => {
	const { commentId } = req.params;
	if (!commentId) {
		throw new ApiError(401, "Comment id is required");
	}

	const numberOfLikes = await Like.countDocuments({ comment: commentId });

	return res
		.status(200)
		.json(
			new ApiResponse(
				200,
				{ numberOfLikes },
				"Number of likes fetched successfully",
			),
		);
});

const getTweetLikes = asyncHandler(async (req, res) => {
	const { tweetId } = req.params;
	if (!tweetId) {
		throw new ApiError(401, "Tweet id is required");
	}

	const numberOfLikes = await Like.countDocuments({ tweet: tweetId });

	return res
		.status(200)
		.json(
			new ApiResponse(
				200,
				{ numberOfLikes },
				"Number of likes fetched successfully",
			),
		);
});

const getLikedVideos = asyncHandler(async (req, res) => {
	//TODO: get all liked videos
	const videos = await Like.aggregate([
		{
			$match: {
				likedBy: req.user._id,
				video: { $exists: true },
			},
		},
		{
			$lookup: {
				from: "videos",
				localField: "video",
				foreignField: "_id",
				as: "videoDetails",
			},
		},
		{
			$unwind: {
				path: "$videoDetails",
				preserveNullAndEmptyArrays: true,
			},
		},
		{
			$project: {
				_id: 0,
				videoDetails: 1,
			},
		},
	]);

	return res
		.status(200)
		.json(new ApiResponse(200, videos, "Liked Videos fetched successfully"));
});

const isVideoLiked = asyncHandler(async (req, res) => {
	//TODO: check if video is liked or not
	const { videoId } = req?.params;

	if (!videoId && mongoose.Types.ObjectId.isValid(videoId)) {
		throw new ApiError(400, "VideoId is Invalid");
	}

	const response = await Like.findOne({
		likedBy: req?.user?._id,
		video: videoId,
	});
	const isLiked = response ? true : false;
	if (!isLiked) {
		return res
			.status(200)
			.json(
				new ApiResponse(200, isLiked, "Video is not liked by the current user"),
			);
	}
	return res
		.status(200)
		.json(new ApiResponse(200, true, "Video is liked by the current user"));
});

const isTweetLikedByUser = asyncHandler(async (req, res) => {
	const { tweetId } = req.params;

	const isLiked = await Like.findOne({
		tweet: tweetId,
		likedBy: req.user?._id,
	});

	if (isLiked) {
		console.log("already liked by user");
		return res
			.status(200)
			.json(new ApiResponse(200, { isLiked: true }, "Tweet liked"));
	}

	return res
		.status(200)
		.json(
			new ApiResponse(200, { isLiked: false }, "Tweet like status fetched"),
		);
});

export {
	toggleCommentLike,
	toggleTweetLike,
	toggleVideoLike,
	getLikedVideos,
	getVideoLikes,
	getCommentLikes,
	getTweetLikes,
	isVideoLiked,
	isTweetLikedByUser,
};
