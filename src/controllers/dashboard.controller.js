import mongoose from "mongoose"
import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { getAllVideos } from "./video.controller.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
    const channelId=req.user._id;

    if(!channelId){
        throw new ApiError(400,"channelId is required");
    }

    const totalVideos = await Video.countDocuments({owner: channelId});

    const totalSubscribers = await Subscription.countDocuments({channel: channelId});

    const totalVideoViews = await Video.aggregate([
        {
            $match:{
                owner: channelId
            }
        },
        {
            $group:{
                _id: null,
                totalViews: {$sum: "$views"}
            }
        },
        {
            $project:{
                _id: 0,
                totalViews: 1,
            }
        }
    ]);

    return res.status(200)
    .json(new ApiResponse(
        200,
        {
            totalVideos,
            totalSubscribers,
            totalVideoViews: totalVideoViews[0]?.totalViews || 0,
        },
        "Total videos, Total subscribers fetched successfully"
    ));
})

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel
    const channelId=req.user._id;

    if(!channelId){
        throw new ApiError(400,"Channel ID is required");
    }

    const newReq={
        query:{
            userId: req.user._id,
            ...req.query
        },
    }

    const channelVideos = getAllVideos(newReq, res);

    return res.status(200)
    .json(new ApiResponse(
        200,
        channelVideos,
        "Channel videos fetched successfully"
    ));
})

export {
    getChannelStats, 
    getChannelVideos
    }