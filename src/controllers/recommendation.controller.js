import { Recommendation } from "../models/recommendation.model.js";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getAllVideos } from "./video.controller.js";
import { Notification } from "../models/notification.model.js";

const addCustomTag = asyncHandler(async (req, res) => {
	const { type } = req.params;
	const { tag, relation } = req.body;

	if (!tag || (Array.isArray(tag) && tag.length === 0)) {
		throw new ApiError(400, "Tag is required");
	}

	// Check if this user has a parent and if trying to modify excludedTags
	if ((type === "exclude" && relation=="child")) {
		const userRecommendation = await Recommendation.findOne({ user: req.user._id });
		if (userRecommendation && userRecommendation.parentUser) {
			throw new ApiError(403, "You don't have permission to modify excluded tags. Only your parent can do that.");
		}
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
	const { tag, relation } = req.body;

	if (!tag) {
		throw new ApiError(400, "Tag is required");
	}

	// Check if this user has a parent and if trying to modify excludedTags
	if ((type === "exclude" && relation === "child")) {
		const userRecommendation = await Recommendation.findOne({ user: req.user._id });
		if (userRecommendation && userRecommendation.parentUser) {
			throw new ApiError(403, "You don't have permission to modify excluded tags. Only your parent can do that.");
		}
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

	console.log("has parent: ",userRecommendation);

	return res.status(200).json(
		new ApiResponse(
			200,
			{
				tags: userRecommendation.tags,
				excludedTags: userRecommendation.excludedTags,
				hasParent: userRecommendation.parentUser && userRecommendation.parentUser.length>0
			},
			"Tags fetched successfully",
		),
	);
});

// New functions for parent-child relationship
const linkChildToParent = asyncHandler(async (req, res) => {
	const { childUserId } = req.body;
	
	if (!childUserId) {
		throw new ApiError(400, "Child user ID is required");
	}
	
	// Check if child user exists
	const childRecommendation = await Recommendation.findOne({ user: childUserId });
	
	if (!childRecommendation) {
		// Create a new recommendation for the child if it doesn't exist
		const newChildRecommendation = await Recommendation.create({
			user: childUserId,
			parentUser: req.user._id,
			tags: [],
			excludedTags: []
		});
		
		return res
			.status(201)
			.json(
				new ApiResponse(201, newChildRecommendation, "Child account created and linked to parent successfully")
			);
	}
	
	// Update child's recommendation to link to parent
	const updatedChildRecommendation = await Recommendation.findOneAndUpdate(
		{ user: childUserId },
		{ parentUser: req.user._id },
		{ new: true }
	);
	
	return res
		.status(200)
		.json(
			new ApiResponse(200, updatedChildRecommendation, "Child linked to parent successfully")
		);
});

const unlinkChildFromParent = asyncHandler(async (req, res) => {
	const { childUserId } = req.params;
	
	if (!childUserId) {
		throw new ApiError(400, "Child user ID is required");
	}
	
	// Verify the requesting user is the parent of the child
	const childRecommendation = await Recommendation.findOne({ 
		user: childUserId,
		parentUser: req.user._id
	});
	
	if (!childRecommendation) {
		throw new ApiError(403, "You don't have permission to unlink this child");
	}
	
	// Remove parent link
	const updatedChildRecommendation = await Recommendation.findOneAndUpdate(
		{ user: childUserId },
		{ $unset: { parentUser: "" } },
		{ new: true }
	);
	
	// Create notification for child
	await Notification.create({
		recipient: childUserId,
		sender: req.user._id,
		type: "PARENT_REQUEST",
		message: `${req.user.username} has removed the parent account connection.`,
	});
	
	return res
		.status(200)
		.json(
			new ApiResponse(200, updatedChildRecommendation, "Child unlinked from parent successfully")
		);
});

const getChildrenAccounts = asyncHandler(async (req, res) => {
	// Find all recommendations where current user is the parent
	const childrenRecommendations = await Recommendation.find({ 
		parentUser: req.user._id 
	}).populate("user", "username fullName avatar");
	
	return res
		.status(200)
		.json(
			new ApiResponse(200, childrenRecommendations, "Children accounts fetched successfully")
		);
});

const getChildTags = asyncHandler(async (req, res) => {
	const { childUserId } = req.params;
	
	// Verify the requesting user is the parent of the child
	const childRecommendation = await Recommendation.findOne({ 
		user: childUserId,
		parentUser: req.user._id
	});
	
	if (!childRecommendation) {
		throw new ApiError(403, "You don't have permission to view this child's tags");
	}
	
	return res
		.status(200)
		.json(
			new ApiResponse(
				200, 
				{
					tags: childRecommendation.tags,
					excludedTags: childRecommendation.excludedTags
				},
				"Child tags fetched successfully"
			)
		);
});

const updateChildExcludedTags = asyncHandler(async (req, res) => {
	console.log("called updateChildET");
	const { childUserId } = req.params;
	const { tag, action } = req.body; // action can be 'add' or 'remove'
	console.log("received tag & action: ", tag, action);
	
	if (!tag || !action) {
		throw new ApiError(400, "Tag and action are required");
	}
	
	// Verify the requesting user is the parent of the child
	const childRecommendation = await Recommendation.findOne({ 
		user: childUserId,
		parentUser: req.user._id
	});
	
	if (!childRecommendation) {
		throw new ApiError(403, "You don't have permission to update this child's tags");
	}
	
	const tagsToProcess = Array.isArray(tag) 
		? tag.map(t => t.toLowerCase()) 
		: [tag.toLowerCase()];
	
	let updateOperation;
	if (action === 'add') {
		updateOperation = {
			$addToSet: { excludedTags: { $each: tagsToProcess } }
		};
	} else if (action === 'remove') {
		updateOperation = {
			$pull: { excludedTags: { $in: tagsToProcess } }
		};
	} else {
		throw new ApiError(400, "Invalid action. Use 'add' or 'remove'");
	}
	
	const updatedRecommendation = await Recommendation.findOneAndUpdate(
		{ user: childUserId },
		updateOperation,
		{ new: true }
	);

	console.log("excluded tags res: ", updatedRecommendation);
	
	return res
		.status(200)
		.json(
			new ApiResponse(
				200, 
				updatedRecommendation, 
				`Tags ${action === 'add' ? 'added to' : 'removed from'} child's excluded tags successfully`
			)
		);
});

export { 
	addCustomTag, 
	removeTag, 
	getUserFeed, 
	getUserTags, 
	linkChildToParent,
	unlinkChildFromParent,
	getChildrenAccounts,
	getChildTags,
	updateChildExcludedTags
};
