import { upload } from '../middlewares/multer.middleware.js';
import { User } from '../models/user.model.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import {asyncHandler} from '../utils/asyncHandler.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';


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
    const avatarLocalpath = req.files?.avatar && req.files.avatar.length > 0 ? req.files.avatar[0].path : undefined;
    let coverLocalpath;
    if (req.files?.coverImage && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverLocalpath = req.files.coverImage[0].path;
    }

    if (!avatarLocalpath) {
        throw new ApiError(400, 'Invalid Avatar');
    }

    const avatar = await uploadOnCloudinary(avatarLocalpath);
    const coverImage = await uploadOnCloudinary(coverLocalpath);
    
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
})

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

export { 
    generateAccessandRefreshtoken,
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken
 };