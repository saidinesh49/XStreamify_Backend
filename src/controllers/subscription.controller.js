import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleSubscription = asyncHandler(async (req, res) => {
	const { channelId } = req.params;

	if (!mongoose.Types.ObjectId.isValid(channelId)) {
		console.log("Invalid Channel ID");
		throw new ApiError(400, "Channel ID is required");
	}

	console.log("Received Channel ID:", channelId);

	const subscription = await Subscription.findOne({
		subscriber: req.user?._id,
		channel: channelId,
	});

	console.log("Existing Subscription:", subscription);

	if (subscription) {
		console.log("Unsubscribing from channel");
		await Subscription.deleteOne({ _id: subscription?._id });

		return res
			.status(200)
			.json(new ApiResponse(200, null, "Unsubscribed Successfully"));
	} else {
		console.log("Subscribing to channel");
		const response = await Subscription.create({
			subscriber: req.user?._id,
			channel: channelId,
		});

		if (!response) {
			console.log("Failed to subscribe");
			throw new ApiError(500, "Failed to subscribe");
		}

		console.log("Subscription created:", response);
		return res
			.status(201)
			.json(new ApiResponse(201, response, "Subscribed successfully"));
	}
});

// controller to return subscribers list of a channel (in form of json array)
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
	const { channelId } = req.params;
	if (!channelId) {
		throw new ApiError(400, "channelId is required");
	}
	const subscribers = await Subscription.aggregate([
		{
			$match: {
				channel: channelId,
			},
		},
		{
			$lookup: {
				from: "users",
				localField: "subscriber",
				foreignField: "_id",
				as: "subscribedUsers",
				pipeline: [
					{
						$project: {
							username: 1,
							fullName: 1,
							_id: 1,
							avatar: 1,
						},
					},
				],
			},
		},
		{
			$unwind: "$subscribedUsers", // Flatten the array
		},
		{
			$replaceRoot: { newRoot: "$subscribedUsers" }, // Set the root to be the user object
		},
	]);

	return res
		.status(200)
		.json(
			new ApiResponse(200, subscribers, "Subscribers Retrieved Successfully"),
		);
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
	const { channelId } = req.params;

	if (!channelId) {
		throw new ApiError(400, "SubscriberId is missing");
	}

	// Check if there are subscriptions with the given channelId
	const subscriptionCount = await Subscription.countDocuments({
		subscriber: channelId,
	});
	console.log(
		`Number of subscriptions found for channelId ${channelId}: ${subscriptionCount}`,
	);

	const channelList = await Subscription.aggregate([
		{
			$match: {
				subscriber: new mongoose.Types.ObjectId(channelId),
			},
		},
		{
			$lookup: {
				from: "users",
				localField: "channel",
				foreignField: "_id",
				as: "subscribedToChannels",
			},
		},
		{
			$project: {
				username: { $arrayElemAt: ["$subscribedToChannels.username", 0] },
				fullName: { $arrayElemAt: ["$subscribedToChannels.fullName", 0] },
				_id: { $arrayElemAt: ["$subscribedToChannels._id", 0] },
				avatar: { $arrayElemAt: ["$subscribedToChannels.avatar", 0] },
			},
		},
	]);

	console.log("Aggregated channel list:", channelList);

	return res
		.status(200)
		.json(
			new ApiResponse(
				200,
				channelList,
				"Subscribed Channels Retrieved Successfully",
			),
		);
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
