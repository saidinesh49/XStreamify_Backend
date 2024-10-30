import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params;
    // TODO: toggle subscription
    if(!channelId) {
        throw new ApiError(400, "Channel ID is required");
    }

    const subscription=await Subscription.findOne({
        subscriber: req.user?._id,
        channel: channelId,
    });

    if(subscription){
        await Subscription.deleteOne({ _id: subscription?._id });
        
        return res.status(200)
        .json(new ApiResponse(
            201,
            null,
            "Unsubscribed Successfully"
        ));
    }
    else{
        const response=await Subscription.create({
            subscriber: req.user?._id,
            channel: channelId
        });

        if(!response){
            throw new ApiError(500, "Failed to subscribe");
        }

        return res.status(201)
        .json(new ApiResponse(
            201,
            response,
            "Subscribed successfully"
        ));
    }

})

// controller to return subscribers list of a channel (in form of json array)
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params;
    if(!channelId){
        throw new ApiError(400,"channelId is required");
    }
    const subscribers = await Subscription.aggregate([
        {
            $match: {
                channel: channelId
            }
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
                            avatar: 1
                        }
                    }
                ]
            }
        },
        {
            $unwind: "$subscribedUsers" // Flatten the array
        },
        {
            $replaceRoot: { newRoot: "$subscribedUsers" } // Set the root to be the user object
        }
    ]);

    return res.status(200)
    .json(new ApiResponse(
        200,
        subscribers,
        "Subscribers Retrieved Successfully"
    ));
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params;

    if(!subscriberId) {
        throw new ApiError(400, "SubscriberId is missing");
    }

    const channelList=await Subscription.aggregate([
        {
            $match:{
                subscriber: subscriberId
            }
        },
        {
            $lookup:{
                from: "users",
                localField: "channel",
                foreignField: "_id",
                as: "subscribedToChannels"
            }
        },
        {
            $unwind:{
                path: "$subscribedToChannels",
                preserveNullAndEmptyArrays: true,
            }
        },
        {
            $project:{
                username: "$subscribedToChannels.username",
                fullName: "$subscribedToChannels.fullName",
                _id: "$subscribedToChannels._id",
                avatar: "$subscribedToChannels.avatar",
            }
        }
    ]);

    return res.status(200)
    .json(new ApiResponse(
        200,
        channelList,
        "Subscribed Channels Retrieved Successfully"
    ));
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}