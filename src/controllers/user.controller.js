import { upload } from '../middlewares/multer.middleware.js';
import { User } from '../models/user.model.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import {asyncHandler} from '../utils/asyncHandler.js';
import { deleteFromCloudinary, uploadOnCloudinary } from '../utils/cloudinary.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import mongoose from 'mongoose';


const generateAccessandRefreshtoken=async(userId)=>{

    try{
    if(!userId){
        throw new ApiError(401,'User id is required');
    }

    const user=await User.findById(userId);

    const accessToken=await user.generateAccessToken();
    const refreshToken=await user.generateRefreshToken();

    user.refreshToken=refreshToken;

    await user.save({validateBeforeSave: false});

    return {accessToken,refreshToken};
    }
    catch(error){
        throw new ApiError(error.code || 500,'Something went wrong while generating tokens');
    }
}

const loginUser = async (req, res) => {
    const { username, email, password } = req.body;

    if (!(username || email)) {
        throw new ApiError(400, 'Username or email is required');
    }

    if (!password) {
        throw new ApiError(400, 'Password is required');
    }

    const user = await User.findOne({
        $or: [{ username }, { email }]
    });

    if (!user) {
        throw new ApiError(404, 'User does not exist');
    }

    const isPasswordMatching = await user.isPasswordCorrect(password);

    if (!isPasswordMatching) {
        throw new ApiError(401, 'Invalid user credentials');
    }

    const { accessToken, refreshToken} = await generateAccessandRefreshtoken(user._id);

    // Await the user fetch to ensure you get the actual data
    const loggedin = await User.findById(user._id).select("-password -refreshToken");

    const options = {
        httpOnly: true,
        secure: false,
    };

    console.log("User : ",loggedin, accessToken);

    return res.status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(new ApiResponse(
            200,
            {
                user: loggedin, // This should now be a plain object
                accessToken,
                refreshToken
            },
            'User logged in successfully'
        ));
};


const registerUser = asyncHandler(async (req, res) => {
    const { fullName, username, email, password } = req.body;

    if ([fullName, username, email, password].some(field => field?.trim() === "")) {
        throw new ApiError(400, "All fields are required");
    }

    const responseExists = await User.findOne({ $or: [{ username }, { email }] });
    if (responseExists) {
        throw new ApiError(400, 'User already exists');
    }

    console.log(req.files);
    const avatarLocalpath = req.files?.avatar && req.files.avatar.length>0 ? req.files.avatar[0].path : undefined;
    const coverLocalPath=req.files?.coverImage && req.files.coverImage.length>0 ? req.files.coverImage[0].path : undefined;

    if (!avatarLocalpath) {
        console.log(req.files);
        throw new ApiError(400, 'Invalid Avatar');
    }

    const avatar = await uploadOnCloudinary(avatarLocalpath);
    const coverImage= await uploadOnCloudinary(coverLocalPath);
    
    if (!avatar) {
        throw new ApiError(400, "Avatar upload failed");
    }

    const registrationStatus = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password: password,
        username: username.toLowerCase(),
    });

    const createdUser = await User.findById(registrationStatus._id).select("-password -refreshToken");
    if (!createdUser) {
        throw new ApiError('Something went wrong while registering the user');
    }

    return res.status(201).json(new ApiResponse(201, createdUser, "User registered successfully"));
});


const logoutUser = asyncHandler(async (req, res) => {
    console.log("This is user data before logout: ",req.user)
    await User.findByIdAndUpdate(req.user._id,
        {
            $unset: {
                refreshToken: 1 // this removes the field from document
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: false,
    }
    console.log('User logout Successfully!');
    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(
            new ApiResponse(200, {}, "User logged out")
        )
});

const refreshAccessToken= asyncHandler( async(req, res)=>{
    try {
        const presentRefreshToken=req?.cookies?.refreshToken || null;
        if(!presentRefreshToken){
            throw new ApiError(401,"UnAuthorized request");
        }
    
        const decodedToken=jwt.verify(presentRefreshToken,process.env.REFRESH_TOKEN_SECRET);
    
        const user=await User.findById(decodedToken?._id).select('-password');
    
        if(!user){
            throw new ApiError(401,'Invalid refresh token');
        }

        if(presentRefreshToken!=user?.refreshToken){
            throw new ApiError(401,'Refresh token expired');
        }
    
        const {accessToken, refreshToken}=await generateAccessandRefreshtoken(user?._id);

        const options = {
            httpOnly: true,
            secure: false
        }
        
        console.log('Access Token Refresh Successfull!!');

        return res.status(200)
        .cookie('accessToken',accessToken,options)
        .cookie('refreshToken',refreshToken,options)
        .json(new ApiResponse(
            200,
            {
                accessToken,
                refreshToken: refreshToken,
            },
            'Access token Refreshed Successfully!'
        ));
    } catch (error) {
        console.log(error.statusCode || 400, error.message || 'Something went wrong while refreshing the access Token');
        res.status(error.statusCode || 400)
        .json({
            message: error.message || 'Something went wrong while refreshing the access Token'
        })
    }

});

const changeCurrentPassword= asyncHandler( async(req,res)=>{
    const { oldPassword,newPassword }=req.body;
    if(!oldPassword || !newPassword){
        throw new ApiError(400, 'Password not provided properly');
    }

    const accessToken=req?.cookies?.accessToken;

    const decodedToken=await jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);

    const user=await User.findById(decodedToken?._id);

    const ispasswordCorrect=await user.isPasswordCorrect(oldPassword);

    if(!ispasswordCorrect){
        throw new ApiError(401, 'Oldpassword Invalid');
    }

    user.password=newPassword;

    await user.save({validateBeforeSave: false});

    res.status(200)
    .json(
        new ApiResponse(
            200,
            {},
            'Password updated successfully'
        )
    )
}

);

const getCurrentUser=asyncHandler( async(req,res)=>{
    return res.status(200)
    .json(new ApiResponse(
        200, req.user, "current user fetched successfully"
    ))
});


const updateAccountDetails=asyncHandler( async(req,res)=>{

    const { fullName, email }=req.body;

    if(!fullName || !email){
        throw new ApiError(400, 'Full name and email not provided properly');
    }

    const checkuser=req?.user?._id;

    if(!checkuser){
        throw new  ApiError(401, 'User UnAuthorized');
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                fullName: fullName,
                email: email
            }
        },
        { new: true }
    ).select("-password");

    return res.status(200)
    .json(new ApiResponse(
        200,
        user,
        "Account details updated successfully"
    ));

});


const updateUserAvatar=asyncHandler( async(req, res)=>{
    
    const avatarLocalpath=req.file?.path;

    console.log(avatarLocalpath);

    if(!avatarLocalpath){
        throw new ApiError(400,"Avatar is missing",req.file);
    }

    const avatar=await uploadOnCloudinary(avatarLocalpath);

    if(!avatar){
        throw new ApiError(400,'Error while uploading avatar image');
    }

    const oldAvatarUrl=await User.findById(req.user?._id).select("avatar");

    console.log('Old avatar id: ',avatar);

    const user=await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avatar: avatar.url
            }
        },
        { new: true }
    ).select("-password");


    const deletedResponse = await deleteFromCloudinary(oldAvatarUrl);

    console.log('Deleted old avatar response: ', deletedResponse,' for the user ',user);

    return res.status(200)
    .json(new ApiResponse(
        200,
        user,
        "Avatar Image updated successfully"
    ))
});

const updateUserCoverImage=asyncHandler( async(req, res)=>{
    const coverImageLocalpath=req.file?.path;

    console.log(coverImageLocalpath);

    if(!coverImageLocalpath){
        throw new ApiError(400,"Cover Image is missing",req.file);
    }

    const coverImage=await uploadOnCloudinary(coverImageLocalpath);

    if(!coverImage){
        throw new ApiError(400,'Error while uploading cover image');
    }

    const oldCoverImageUrl=await User.findById(req.user?._id).select("coverImage");

    
    const user=await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                coverImage: coverImage.url
            }
        },
        { new: true }
    ).select("-password");
    
    
    if (oldCoverImageUrl) {
        console.log('Old Cover Image url: ',oldCoverImageUrl);
        const deletedResponse = await deleteFromCloudinary(oldCoverImageUrl);
        console.log(deletedResponse,' for the user ',user);
    }


    return res.status(200)
    .json(new ApiResponse(
        200,
        user,
        "Cover Image updated successfully"
    ))
});

const getUserChannelProfile=asyncHandler( async(req, res)=>{
   const {username} = req.params;

   if(!username.trim()){
    throw new ApiError(400, 'Username is missing');
   }

   const channel = await User.aggregate([
      {
         $match: {
            username: username?.toLowerCase()
         }
      },
      {
         $lookup: {
            from: 'subcriptions',
            localField: '_id',
            foreignField: 'channel',
            as: "subscribers"
         }
      },
      {
         $lookup: {
            from: 'subcriptions',
            localField: '_id',
            foreignField: 'subscriber',
            as: "subscribedTo"
         }
      },
      {
        $addFields: {
            subsribersCount: {
                $size: "$subscribers"
            },
            channelSubscribedToCount: {
                $size: "$subscribedTo"
            },
            isSubscribed: {
                $cond: {
                    if: { $in: [req.user?._id ,"$subscribers.subscriber"] },
                    then: true,
                    else: false
                }
            }
        }
      },
      {
        $project: {
            username: 1,
            email: 1,
            fullName: 1,
            avatar: 1,
            coverImage: 1,
            subsribersCount: 1,
            channelSubscribedToCount: 1,
            isSubscribed: 1,
        }
      }
   ]);

   if (!channel?.length) {
    throw new ApiError(404,"channel does not exist");
   }

   console.log('About Channel: ',channel[0]);

   return res.status(200)
   .json(new ApiResponse(200, channel[0], "channel details fetched successfully"));

});

const getUserWatchHistory=asyncHandler( async (req, res) => {
    const user= await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(String(req.user?._id))
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                      $lookup: {
                        from: "users",
                        localField: "owner",
                        foreignField: "_id",
                        as: "owner"
                      }
                    },
                    {
                        $project: {
                            fullName: 1,
                            username: 1,
                            avatar: 1
                        }
                    },
                    {
                        $addFields:{
                            owner:{
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        },
    ]);

    return res.status(200)
    .json(new ApiResponse(
        200,
        user[0].watchHistory,
        "User Watch History fetched successfully"
    ));
}

);

export { 
    generateAccessandRefreshtoken,
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getUserWatchHistory
};