import mongoose, { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import { User } from "../models/user.model.js";
import { Comment } from "../models/comment.model.js";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createTweet = asyncHandler(async (req, res) => {
	//TODO: create tweet
	const { content } = req.body;
	if (!content) {
		throw new ApiError(400, "Content is required");
	}

	const newTweet = await Tweet.create({
		content: content,
		owner: req.user._id,
	});

	if (!newTweet) {
		throw new ApiError(500, "Error while creating tweet");
	}

	return res
		.status(201)
		.json(new ApiResponse(200, newTweet, "Tweet created successfully"));
});

const getUserTweets = asyncHandler(async (req, res) => {
	// TODO: get user tweets
	const { userId } = req.params;
	if (!userId) {
		throw new ApiError(400, "Invalid params");
	}

	const tweets = await Tweet.find({ owner: userId });

	return res
		.status(200)
		.json(new ApiResponse(200, tweets, "User tweets fetched successfully"));
});

const updateTweet = asyncHandler(async (req, res) => {
	//TODO: update tweet
	const { tweetId } = req.params;
	const { content } = req.body;
	if (!tweetId) {
		throw new ApiError(400, "Invalid tweet params");
	}

	const updatedTweet = await Tweet.findByIdAndUpdate(
		tweetId,
		{
			$set: {
				content: content,
			},
		},
		{ new: true },
	);

	if (!updatedTweet) {
		throw new ApiError(404, "Tweet not found");
	}

	return res
		.status(200)
		.json(new ApiResponse(200, updatedTweet, "Tweet updated successfully"));
});

const deleteTweet = asyncHandler(async (req, res) => {
	//TODO: delete tweet
	const { tweetId } = req.params;
	if (!tweetId) {
		throw new ApiError(400, "Invalid tweet id");
	}

	await Tweet.deleteOne({ _id: tweetId });
	return res
		.status(200)
		.json(new ApiResponse(200, null, "Tweet deleted successfully"));
});

const likeTweet = asyncHandler(async (req, res) => {
	const { tweetId } = req.params;

	const existingLike = await Like.findOne({
		tweet: tweetId,
		likedBy: req.user?._id,
	});

	if (existingLike) {
		await Like.findByIdAndDelete(existingLike._id);
		return res
			.status(200)
			.json(new ApiResponse(200, { liked: false }, "Tweet unliked"));
	}

	await Like.create({
		tweet: tweetId,
		likedBy: req.user?._id,
	});

	return res
		.status(200)
		.json(new ApiResponse(200, { liked: true }, "Tweet liked"));
});

const getAllTweets = asyncHandler(async (req, res) => {
	const { page = 1, limit = 10 } = req.query;
	const pageNumber = Number(page);
	const limitNumber = Number(limit);

	if (
		isNaN(pageNumber) ||
		isNaN(limitNumber) ||
		pageNumber < 1 ||
		limitNumber < 1
	) {
		throw new ApiError(400, "Invalid page or limit");
	}

	const tweets = await Tweet.find()
		.populate("owner", "username avatar fullName")
		.sort({ createdAt: -1 })
		.skip((pageNumber - 1) * limitNumber)
		.limit(limitNumber);

	if (!tweets) {
		throw new ApiError(404, "No tweets found");
	}

	const totalTweets = await Tweet.countDocuments();

	return res.status(200).json(
		new ApiResponse(
			200,
			{
				tweets,
				totalTweets,
				currentPage: pageNumber,
				totalPages: Math.ceil(totalTweets / limitNumber),
			},
			"Tweets fetched successfully",
		),
	);
});

const getTweetByTweetId = asyncHandler(async (req, res) => {
	const { tweetId } = req.params;

	const tweet = await Tweet.findById(tweetId).populate(
		"owner",
		"username avatar fullName",
	);

	if (!tweet) {
		throw new ApiError(404, "Tweet not found");
	}

	// Get likes count
	const likesCount = await Like.countDocuments({ tweet: tweet._id });

	// Get comments count
	const commentsCount = await Comment.countDocuments({ tweet: tweet._id });

	// Check if logged in user has liked
	const isLiked = await Like.exists({
		tweet: tweet._id,
		likedBy: req.user?._id,
	});

	const tweetDetails = {
		...tweet._doc,
		likesCount,
		commentsCount,
		isLiked: !!isLiked,
	};

	return res
		.status(200)
		.json(new ApiResponse(200, tweetDetails, "Tweet fetched successfully"));
});

export {
	createTweet,
	getUserTweets,
	updateTweet,
	deleteTweet,
	likeTweet,
	getAllTweets,
	getTweetByTweetId,
};
