import { Recommendation } from "../models/recommendation.model.js";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getAllVideos } from "./video.controller.js";

const addCustomTag = asyncHandler(async (req, res) => {
	const { type } = req.params;
	const { tag } = req.body;

	if (!tag || (Array.isArray(tag) && tag.length === 0)) {
		throw new ApiError(400, "Tag is required");
	}

	const tagsToAdd = Array.isArray(tag)
		? tag.map((t) => t.toLowerCase())
		: [tag.toLowerCase()];

	const updateFields =
		type === "include"
			? { tags: { $each: tagsToAdd } }
			: { excludedTags: { $each: tagsToAdd } };

	const userRecommendation = await Recommendation.findOneAndUpdate(
		{ user: req.user._id },
		{
			$addToSet: updateFields,
		},
		{ upsert: true, new: true },
	);

	return res
		.status(200)
		.json(
			new ApiResponse(200, userRecommendation, "Tag(s) added successfully"),
		);
});

const removeTag = asyncHandler(async (req, res) => {
	const { type } = req.params;
	const { tag } = req.body;

	if (!tag) {
		throw new ApiError(400, "Tag is required");
	}

	const tagsToRemove = Array.isArray(tag) ? tag : [tag];

	const updateFields =
		type === "include"
			? { tags: { $in: tagsToRemove } }
			: { excludedTags: { $in: tagsToRemove } };

	const userRecommendation = await Recommendation.findOneAndUpdate(
		{ user: req.user._id },
		{
			$pull: updateFields,
		},
		{ new: true },
	);

	return res
		.status(200)
		.json(
			new ApiResponse(200, userRecommendation, "Tag(s) removed successfully"),
		);
});

const getUserFeed = asyncHandler(async (req, res) => {
	const page = parseInt(req.query.page) || 1;
	const limit = parseInt(req.query.limit) || 10;

	const userRecommendation = await Recommendation.findOne({
		user: req.user?._id,
	});

	if (!userRecommendation || !userRecommendation.tags.length) {
		return res
			.status(200)
			.json(
				new ApiResponse(
					200,
					{ videos: [], currentPage: page, totalPages: 0 },
					"No recommendations available. Please add some interests.",
				),
			);
	}

	// Find videos that contain user's preferred tags AND don't contain any excluded tags
	const videos = await Video.find({
		$and: [
			{ tags: { $in: userRecommendation.tags } },
			{ tags: { $nin: userRecommendation.excludedTags } },
		],
	})
		.populate("owner", "username avatar fullName")
		.sort({ createdAt: -1 })
		.skip((page - 1) * limit)
		.limit(limit);

	const totalVideos = await Video.countDocuments({
		$and: [
			{ tags: { $in: userRecommendation.tags } },
			{ tags: { $nin: userRecommendation.excludedTags } },
		],
	});

	if (totalVideos === 0) {
		return res
			.status(200)
			.json(
				new ApiResponse(
					200,
					{ videos: [], currentPage: page, totalPages: 0 },
					"No videos found matching your interests",
				),
			);
	}

	return res.status(200).json(
		new ApiResponse(
			200,
			{
				videos,
				currentPage: page,
				totalPages: Math.ceil(totalVideos / limit),
			},
			"Feed fetched successfully",
		),
	);
});

const getUserTags = asyncHandler(async (req, res) => {
	const { type } = req.params;
	const userRecommendation = await Recommendation.findOne({
		user: req.user._id,
	});

	if (!userRecommendation) {
		return res
			.status(200)
			.json(
				new ApiResponse(200, { tags: [], excludedTags: [] }, "No tags found"),
			);
	}

	return res.status(200).json(
		new ApiResponse(
			200,
			{
				tags: userRecommendation.tags,
				excludedTags: userRecommendation.excludedTags,
			},
			"Tags fetched successfully",
		),
	);
});

export { addCustomTag, removeTag, getUserFeed, getUserTags };
