import mongoose, { isValidObjectId } from "mongoose";
import { Comment } from "../models/comment.model.js";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getVideoById } from "./video.controller.js";

const getVideoComments = asyncHandler(async (req, res) => {
	const { videoId } = req.params;
	const { page = 1, limit = 10 } = req.query;
	const pageNumber = Number(page);
	const limitNumber = Number(limit);

	if (!videoId) {
		throw new ApiError(400, "Video id is required");
	}

	if (
		isNaN(pageNumber) ||
		isNaN(limitNumber) ||
		pageNumber < 1 ||
		limitNumber < 1
	) {
		throw new ApiError(400, "Invalid page or limit");
	}

	const skipNumber = (pageNumber - 1) * limitNumber;

	const comments = await Comment.find({ video: videoId })
		.populate("owner", "username fullName avatar") // Populate owner details
		.sort({ createdAt: -1 }) // Sort by newest first
		.skip(skipNumber)
		.limit(limitNumber);

	const totalComments = await Comment.countDocuments({ video: videoId });

	return res.status(200).json(
		new ApiResponse(
			200,
			{
				comments,
				totalComments,
				currentPage: pageNumber,
				totalPages: Math.ceil(totalComments / limitNumber),
			},
			"Comments fetched successfully",
		),
	);
});

const addComment = asyncHandler(async (req, res) => {
	const { commentContent } = req.body;
	const { videoId } = req.params;

	if (!commentContent) {
		throw new ApiError(400, "Comment content is required");
	}

	if (!videoId) {
		throw new ApiError(400, "Video id is required");
	}

	if (!isValidObjectId(videoId)) {
		throw new ApiError(400, "Invalid video ID");
	}
	const video = await Video.findById(videoId);

	if (!video) {
		throw new ApiError(404, "Video not found", video);
	}

	const comment = await Comment.create({
		content: commentContent,
		video: videoId,
		owner: req.user._id,
	});

	const populatedComment = await Comment.findById(comment._id).populate(
		"owner",
		"username fullName avatar",
	);

	if (!populatedComment) {
		throw new ApiError(500, "Failed to create comment");
	}

	return res
		.status(201)
		.json(new ApiResponse(201, populatedComment, "Comment added successfully"));
});

const updateComment = asyncHandler(async (req, res) => {
	const { commentContent } = req.body;
	const { commentId } = req.params;

	if (!commentContent || !commentId) {
		throw new ApiError(400, "Comment details missing");
	}

	const comment = await Comment.findOneAndUpdate(
		{ _id: commentId, owner: req.user._id },
		{
			$set: {
				content: commentContent,
			},
		},
		{ new: true },
	).populate("owner", "username fullName avatar");

	if (!comment) {
		throw new ApiError(404, "Comment not found or unauthorized");
	}

	return res
		.status(200)
		.json(new ApiResponse(200, comment, "Comment updated successfully"));
});

const deleteComment = asyncHandler(async (req, res) => {
	const { commentId } = req.params;

	if (!commentId) {
		throw new ApiError(400, "Comment id is required");
	}

	const comment = await Comment.findOneAndDelete({
		_id: commentId,
		owner: req.user._id,
	});

	if (!comment) {
		throw new ApiError(404, "Comment not found or unauthorized");
	}

	return res
		.status(200)
		.json(new ApiResponse(200, {}, "Comment deleted successfully"));
});

const addCommentToTweet = asyncHandler(async (req, res) => {
	const { tweetId } = req.params;
	const { content } = req.body;

	if (!content) {
		throw new ApiError(400, "Content is required");
	}

	const comment = await Comment.create({
		content,
		tweet: tweetId,
		owner: req.user?._id,
	});

	return res
		.status(201)
		.json(new ApiResponse(201, comment, "Comment added successfully"));
});

const getTweetComments = asyncHandler(async (req, res) => {
	const { tweetId } = req.params;

	const comments = await Comment.find({ tweet: tweetId })
		.populate("owner", "username avatar")
		.sort("-createdAt");

	return res
		.status(200)
		.json(new ApiResponse(200, comments, "Comments fetched successfully"));
});

const getTweetCommentsCount = asyncHandler(async (req, res) => {
	const { tweetId } = req.params;

	const commentsCount = await Comment.countDocuments({
		tweet: tweetId,
	});

	return res
		.status(200)
		.json(
			new ApiResponse(
				200,
				{ count: commentsCount },
				"Tweet comments count fetched",
			),
		);
});

const deleteVideoComments = asyncHandler(async (req, res) => {
	const { videoId } = req.params;

	if (!videoId) {
		throw new ApiError(400, "Video id is required");
	}

	const comments = await Comment.deleteMany({ video: videoId });

	return res
		.status(200)
		.json(new ApiResponse(200, comments, "All comments deleted successfully"));
});

const deleteTweetComments = asyncHandler(async (req, res) => {
	const { tweetId } = req.params;

	if (!tweetId) {
		throw new ApiError(400, "Tweet id is required");
	}

	const comments = await Comment.deleteMany({ tweet: tweetId });

	return res
		.status(200)
		.json(
			new ApiResponse(
				200,
				comments,
				"All comments on the Tweet deleted successfully",
			),
		);
});

export {
	getVideoComments,
	addComment,
	updateComment,
	deleteComment,
	addCommentToTweet,
	getTweetComments,
	getTweetCommentsCount,
	deleteVideoComments,
	deleteTweetComments,
};
