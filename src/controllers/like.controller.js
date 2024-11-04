import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { request } from "express"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params;
    //TODO: toggle like on video
    if(!videoId){
        throw new ApiError(401, "Video id is required");
    }

    const like=await Like.findOne({
        video: videoId,
        likedBy: req.user._id,
    });

    if(!like){
        const newLike=await Like.create({
            video: videoId,
            likedBy: req.user._id
        });

        if(!newLike){
            throw new ApiError(500, 'failed to create like for video');
        }

        return res.status(201)
        .json(new ApiResponse(
            201,
            newLike,
            "Liked successfully"
        ));
    }

    await Like.deleteOne({_id: like._id});

    return res.status(200)
    .json(new ApiResponse(
        200,
        null,
        "Unliked Successfully"
    ))
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params;
    //TODO: toggle like on comment
    if(!commentId){
        throw new ApiError(401, "Comment id is required");
    }

    const like=await Like.findOne({
        comment: commentId,
        likedBy: req.user._id,
    });

    if(!like){
        const newLike=await Like.create({
            comment: commentId,
            likedBy: req.user._id,
        });

        if(!newLike){
            throw new ApiError(500, 'failed to create like for comment');
        }

        return res.status(201)
        .json(new ApiResponse(
            201,
            newLike,
            "Liked successfully"
        ));
    }

    await Like.deleteOne({_id: like._id});

    return res.status(200)
    .json(new ApiResponse(
        200,
        null,
        "Unliked Successfully"
    ))

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    //TODO: toggle like on tweet
    if(!tweetId){
        throw new ApiError(401, "Tweet id is required");
    }

    const like=await Like.findOne({
        tweet: tweetId,
        likedBy: req.user._id,
    });

    if(!like){
        const newLike=await Like.create({
            tweet: tweetId,
            likedBy: req.user._id,
        });

        if(!newLike){
            throw new ApiError(500, 'failed to create like for tweet');
        }

        return res.status(201)
        .json(new ApiResponse(
            201,
            newLike,
            "Liked successfully"
        ));
    }

    await Like.deleteOne({_id: like._id});

    return res.status(200)
    .json(new ApiResponse(
        200,
        null,
        "Unliked Successfully"
    ))
})

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    const videos=await Like.aggregate([
        {
            $match:{
                likedBy: req.user._id,
                video: { $exists: true }
            }
        },
        {
            $lookup:{
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "videoDetails"
            }
        },
        {
            $unwind:{
                path: "$videoDetails",
                preserveNullAndEmptyArrays: true,
            }
        },
        {
            $project:{
                _id: 0,
                videoDetails: 1,
            }
        }
    ]);

    return res.status(200)
    .json(new ApiResponse(
        200,
        videos,
        "Liked Videos fetched successfully"
    ));
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}