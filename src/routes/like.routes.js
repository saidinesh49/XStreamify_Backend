import { Router } from "express";
import {
	getLikedVideos,
	toggleCommentLike,
	toggleVideoLike,
	toggleTweetLike,
	getTweetLikes,
	getVideoLikes,
	getCommentLikes,
	isVideoLiked,
	isTweetLikedByUser,
	deleteVideoLikes,
	deleteTweetLikes,
} from "../controllers/like.controller.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";

const router = Router();
router.use(verifyJwt); // Apply verifyJWT middleware to all routes in this file

router.route("/toggle/v/:videoId").post(toggleVideoLike);
router.route("/toggle/c/:commentId").post(toggleCommentLike);
router.route("/toggle/t/:tweetId").post(toggleTweetLike);

router.route("/videos").get(getLikedVideos);
router.route("/:videoId/all").delete(deleteVideoLikes);
router.route("/:tweetId/all").delete(deleteTweetLikes);

router.route("/videos/:videoId").get(getVideoLikes);
router.route("/tweets/:tweetId").get(getTweetLikes);
router.route("/comments/:commentId").get(getCommentLikes);

router.route("/videos/:videoId/check").get(isVideoLiked);
router.route("/tweets/:tweetId/check").get(isTweetLikedByUser);

export default router;
