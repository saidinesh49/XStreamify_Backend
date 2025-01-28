import { Router } from "express";
import {
	createTweet,
	deleteTweet,
	getUserTweets,
	updateTweet,
	likeTweet,
	getAllTweets,
	getTweetByTweetId,
} from "../controllers/tweet.controller.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";

const router = Router();
router.use(verifyJwt); // Apply verifyJWT middleware to all routes in this file

router.route("/").get(getAllTweets).post(createTweet);
router.route("/user/:userId").get(getUserTweets);
router
	.route("/:tweetId")
	.get(getTweetByTweetId)
	.patch(updateTweet)
	.delete(deleteTweet);
router.route("/:tweetId/toggleLike").post(likeTweet);

export default router;
