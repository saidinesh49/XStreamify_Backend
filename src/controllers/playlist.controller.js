import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body;
    //TODO: create playlist
    if(!name || !description) {
        throw new ApiError(400,"Playlist Name and description is required");
    }

    const newPlaylist=await Playlist.create({
        name: name,
        description: description,
        owner: req.user?._id
    });

    if(!newPlaylist){
        throw new ApiError(500,"Error while new creating playlist");
    }

    return res.status(201)
    .json(new ApiResponse(
        201,
        newPlaylist,
        "Playlist created successfully"
    ));
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params;
    //TODO: get user playlists
    if(!userId || !isValidObjectId(userId)){
        throw new ApiError(400,"Invalid User Id");
    }
    const playLists=await Playlist.aggregate([
        {
            $match:{
                owner: userId
            }
        },
        {
            $project:{
                name: 1,
                description: 1,
                videos: 1,
            }
        }
    ]);

    return res.status(200)
    .json(new ApiResponse(
        200,
        playLists,
        "User Playlists fetched successfully"
    ));
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params;
    //TODO: get playlist by id
    if(!isValidObjectId(playlistId)){
        throw new ApiError(400, "Invalid playlist id");
    }

    const playlist=await Playlist.findById(playlistId);
    if(!playlist){
        throw new ApiError(404, "Playlist not found");
    }

    return res.status(200)
    .json(new ApiResponse(
        200,
        playlist,
        "Playlist fetched successfully"
    ));
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params;
    if(!isValidObjectId(playlistId)){
        throw new ApiError(400, "Invalid playlist id");
    }
    const playlist=await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $push:{
                videos: videoId,
            }
        },
        { new: true }
    );

    if(!playlist){
        throw new ApiError(500,"Error while adding video to playlist");
    }

    return res.status(200)
    .json(new ApiResponse(
        201,
        playlist,
        "Video added to playlist successfully"
    ));
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    // TODO: remove video from playlist
    if(!isValidObjectId(playlistId)){
        throw new ApiError(400,"Error while removing video from playlist");
    }

    const playlist=await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $pull:{
                videos: videoId,
            }
        },
        { new: true }
    );

    if(!playlist){
        throw new ApiError(500,"Error while removing video from playlist");
    }

    return res.status(200)
    .json(new ApiResponse(
        200,
        playlist,
        "Video removed from playlist successfully"
    ));

})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params;
    // TODO: delete playlist
    if(!isValidObjectId(playlistId)){
        throw new ApiError(400, "Invalid playlist id");
    }

    await Playlist.deleteOne({ _id: playlistId});

    return res.status(200)
   .json(new ApiResponse(
        201,
        null,
        "Playlist deleted successfully"
   ));
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    //TODO: update playlist
    if(!isValidObjectId(playlistId)){
        throw new ApiError(400, "Invalid playlist id");
    }
    const updatedPlaylist=await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $set:{
                name: name,
                description: description,
            }
        },
        { new: true }
    );

    if(!updatedPlaylist){
        throw new ApiError(500, "Error while updating the playlist");
    }

    return res.status(200)
    .json(new ApiResponse(
        200,
        updatedPlaylist,
        "Playlist updated successfully"
    ));
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}