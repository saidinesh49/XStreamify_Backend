import { Router } from "express";
import { changeCurrentPassword, getCurrentUser, getUserChannelProfile, getUserWatchHistory, loginUser, logoutUser, refreshAccessToken, registerUser, updateAccountDetails, updateUserAvatar, updateUserCoverImage } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";

const router=Router()

router.route("/register").post(
    upload.fields([{
        name:"avatar",
        maxCount:1,
    },{
        name:"coverImage",
        maxCount: 1,
    }])
    ,registerUser);


router.route('/login').post(loginUser);

router.route('/logout').post(verifyJwt,logoutUser);

router.route('/refresh-access').post(refreshAccessToken);

router.route('/change-password').post(verifyJwt,changeCurrentPassword);

router.route('/update-avatar').patch(
    upload.single('avatar'),
    verifyJwt,
    updateUserAvatar);

router.route('/update-coverimage').patch(
    upload.single('coverImage'),
    verifyJwt,
    updateUserCoverImage);

router.route('/current-user').get(verifyJwt, getCurrentUser);

router.route('/update-account').patch(verifyJwt, updateAccountDetails);

router.route('/c/:username').get(verifyJwt, getUserChannelProfile);

router.route('/history').get(verifyJwt, getUserWatchHistory);

export default router;