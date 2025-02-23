import { Router } from "express";
import {
	changeCurrentPassword,
	getCurrentUser,
	getUserByObjectId,
	getUserChannelProfile,
	getUserWatchHistory,
	loginUser,
	loginUserFromFirebaseData,
	logoutUser,
	refreshAccessToken,
	registerUser,
	updateAccountDetails,
	updateUserAvatar,
	updateUserCoverImage,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import {
	verifyFirebaseToken,
	verifyJwt,
} from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(
	// upload.fields([
	// 	{
	// 		name: "avatar",
	// 		maxCount: 1,
	// 	},
	// 	{
	// 		name: "coverImage",
	// 		maxCount: 1,
	// 	},
	// ]),
	registerUser,
);

router
	.route("/gauth/login")
	.post(verifyFirebaseToken, loginUserFromFirebaseData);

router.route("/login").post(loginUser);

router.route("/logout").post(verifyJwt, logoutUser);

router.route("/refresh-access").post(refreshAccessToken);

router.route("/change-password").post(verifyJwt, changeCurrentPassword);

router.route("/update-avatar").patch(verifyJwt, updateUserAvatar);

router.route("/update-coverimage").patch(verifyJwt, updateUserCoverImage);

router.route("/current-user").get(verifyJwt, getCurrentUser);

router.route("/:objectid").get(getUserByObjectId);

router.route("/update-account").patch(verifyJwt, updateAccountDetails);

router.route("/c/:username").get(verifyJwt, getUserChannelProfile);

router.route("/history").get(verifyJwt, getUserWatchHistory);

export default router;
