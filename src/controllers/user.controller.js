import { upload } from '../middlewares/multer.middleware.js';
import { User } from '../models/user.model.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import {asyncHandler} from '../utils/asyncHandler.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js';


const generateAccessandRefreshtoken=async(userId)=>{

    try{
    if(!userId){
        throw new ApiError(401,'User id is required');
    }

    const user=await User.findOne(userId);

    const accessToken=user.generateAccessToken();
    const refreshToken=user.ggenerateRefreshToken();

    user.refreshToken=refreshToken;

    await user.save({validateBeforeSave: false});

    return {accessToken,refreshToken};
    }
    catch(error){
        throw new ApiError(error.code || 500,'Something went wrong while generating tokens');
    }
}

const loginUser=async(req,res)=>{
    
    const {username, email, password}=req.body;

    if(!(username || email)){
        throw new ApiError(401,'Username or email is required');
    }

    if(!password){
        throw new ApiError(401,'Password is required');
    }

    const user=await User.findOne({
        $or:[{username},{email}]
    })

    if(!user){
        throw new ApiError(500,'User doesnot exist');
    }

    const ispasswordmatching=await user.isPasswordCorrect(password);

    if(!ispasswordmatching){
        throw new ApiError(401,'Invalid user credentials');
    }

    const {accessToken, refreshToken}=await generateAccessandRefreshtoken(user._id);

    const loggedin=User.findById(user._id).select(
        "-password -refreshToken"
    )

    const options={
        httpOnly: true,
        secure: true,
    }

    return res.status(200).cookie("accessToken",accessToken,options).cookie("refreshToken",refreshToken,options).json(
        new ApiResponse(
            200,
            {
                user: loggedin,accessToken,refreshToken
            },
            'User loggedin successfully',
        )
    );

}

const registerUser=asyncHandler(async(req,res)=>{
    // get user details from frontend
    // validation - not empty
    // check if user already exists: username, email
    // check for images, check for avatar
    // upload them to cloudinary, avatar
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creation
    // return res

    const {fullName, username, email, password}=req.body;
    console.log("data destructured by controller successfully")
    
    if([fullName, username, email, password].some((fields)=>fields?.trim()==="")){
        throw new ApiError(400, "All fields are required");
    }

    console.log("All fields given by user");

    const responseExists=await User.findOne({
        $or:[{username},{email}]
    })

    if(responseExists) {
        throw new ApiError(400,'User already exists');
    }
    
    const avatarLocalpath=req.files?.avatar[0]?.path;
    // const coverLocalpath=req.files?.coverImage[0]?.path || "";

    let coverLocalpath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length>0){
        coverLocalpath=req.files.coverImage[0].path;
    }
    
    console.log("files recieved",req.files);


    if(avatarLocalpath==="") {
        throw new ApiError(400,'Invaid Avatar')
    }

    const avatar=await uploadOnCloudinary(avatarLocalpath);
    const coverImage=await uploadOnCloudinary(coverLocalpath);
    
    console.log("uploaded on cloudinary");

    if(!avatar){
        throw new ApiError(400,"avatar is required");
    }

    console.log("User registration intialized...");

    const registrationStatus=await User.create({
        fullName: fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email: email,
        password: password,
        username: username.toLowerCase(),
    })

    const createdUser=await User.findById(registrationStatus._id).select(
        "-password -refreshToken"
    );

    if(!createdUser){
        throw new ApiError('Something went wrong while registering the user');
    }

    return res.status(201).json(
        new ApiResponse(201, createdUser, "User registered successfully")
    );
        // res.status(200).json({
        //     message: "ok! done man"
        // })
})


const logoutUser= asyncHandler( async(req,res) =>{
    await User.findByIdAndUpdate(req.user._id,
        {
            $set:{
                refreshToken: undefined,
            }
        },
        {
            new: true,
        }
    )

    const options={
        httpOnly: true,
        secure: true,
    }

    res.status(200)
    .clearCookie('accessToken',options)
    .clearCookie('refreshToken',options)
    .json(new ApiError(200,{}, "User Logout Successfully"));
}

);

export { registerUser, loginUser };