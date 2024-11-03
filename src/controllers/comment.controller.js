import mongoose from "mongoose"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { getVideoById } from "./video.controller.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params;
    const {page = 1, limit = 10} = req.query;
    const pageNumber=Number(page);
    const limitNumber=Number(limit);

    if(!videoId){
        throw new ApiError(400, "Video id is required");
    }

    if(isNaN(pageNumber) || isNaN(limitNumber) || pageNumber<1 || limitNumber<1){
        throw new ApiError(400, "Invalid page or limit");
    }

    const skipNumber=(pageNumber-1)*limitNumber;

    const comments=await Comment.find({video: videoId})
    .skip(skipNumber)
    .limit(limitNumber);

    const totalComments=await Comment.countDocuments({video: videoId});

    return res.status(200)
    .json(new ApiResponse(
        200,
        {
            comments,
            totalComments,
            pageNumber:pageNumber
        },
        "comments fetched successfully"
    ));

})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const {commentContent}=req.body;
    const {videoId} = req.params;
    if(!commentContent){
        throw new ApiError(400, "Comment is required");
    }

    const video =await getVideoById(videoId);
    if(!video){
        throw new ApiError(400, "Invalid video id");
    }

    const newComment=await Comment.create({
        content: commentContent,
        video: videoId,
        owner: video.owner
    });

    if(!newComment){
        throw new ApiError(500, 'failed to create comment');
    }

    return res.status(201)
   .json(new ApiResponse(
       201,
       newComment,
       "Comment created successfully"
   ));
})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const {commentContent}=req.body;
    const {commentId} = req.params;
    if(!commentContent || !commentId) {
    throw new ApiError(400,'Comment details missing');
    }
    const comment =await Comment.findByIdAndUpdate(
        commentId,
        {
            $set:{
                content: commentContent,
            }
        },
        {new: true}
    );
    if(!comment){
        throw new ApiError(400,'Comment not found');
    }

    return res.status(200)
   .json(new ApiResponse(
       200,
       comment,
       "Comment updated successfully"
   ));
})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const {commentId} = req.params;
    if(!commentId){
        throw new ApiError(400, "Comment id is required");
    }

    const comment=await Comment.findByIdAndDelete(commentId);
    if(!comment){
        throw new ApiError(404, "Comment not found");
    }

    return res.status(200)
   .json(new ApiResponse(
        200,
        null,
        "Comment deleted successfully"
   ));
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
    deleteComment
    }