import { Router } from "express";
import {
	getVideoComments,
	addComment,
	updateComment,
	deleteComment,
	addCommentToTweet,
	getTweetComments,
	getTweetCommentsCount,
	deleteVideoComments,
	deleteTweetComments,
} from "../controllers/comment.controller.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJwt);

router.route("/:videoId").get(getVideoComments).post(addComment);

router.route("/c/:commentId").patch(updateComment).delete(deleteComment);
router.route("/:videoId/all").delete(deleteVideoComments);
router.route("/:tweetId/all").delete(deleteTweetComments);

router.route("/tweets/:tweetId").get(getTweetComments).post(addCommentToTweet);
router.route("/count/tweets/:tweetId").get(getTweetCommentsCount);

export default router;
