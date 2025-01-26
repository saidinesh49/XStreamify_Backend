import { Router } from "express";
import {
	getSubscribedChannels,
	toggleSubscription,
	getUserChannelSubscribers,
	isUserSubcribedToChannel,
} from "../controllers/subscription.controller.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJwt);

router
	.route("/c/:channelId")
	.get(getSubscribedChannels)
	.post(toggleSubscription);

router.route("/c/:channelId/check").get(isUserSubcribedToChannel);

router.route("/u/followers").get(getUserChannelSubscribers);

export default router;
