
import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const {content} = req.body;
    if(!content){
        throw new ApiError(400,"Content is required");
    }

    const newTweet = await Tweet.create({
        content: content,
        owner: req.user._id
    });

    if(!newTweet){
        throw new ApiError(500,"Error while creating tweet");
    }

    return res.status(201)
    .json(new ApiResponse(
        200,
        newTweet,
        "Tweet created successfully"
    ));
})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    const {userId} = req.params;
    if(!userId){
        throw new ApiError(400,"Invalid params");
    }

    const tweets = await Tweet.find({owner: userId});

    return res.status(200)
    .json(new ApiResponse(
        200,
        tweets,
        "User tweets fetched successfully"
    ));
})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    const {tweetId}=req.params;
    const {content}=req.body;
    if(!tweetId){
        throw new ApiError(400,"Invalid tweet params");
    }

    const updatedTweet = await Tweet.findByIdAndUpdate(
        tweetId,
        {
            $set:{
                content: content,
            }
        },
        { new: true }
    );

    if(!updatedTweet){
        throw new ApiError(404, "Tweet not found");
    }

    return res.status(200)
    .json(new ApiResponse(
        200,
        updatedTweet,
        "Tweet updated successfully"
    ));
})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const {tweetId} = req.params;
    if(!tweetId){
        throw new ApiError(400, "Invalid tweet id");
    }

    await Tweet.deleteOne({_id: tweetId});
    return res.status(200)
    .json(new ApiResponse(
        200,
        null,
        "Tweet deleted successfully"
    ));
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}
