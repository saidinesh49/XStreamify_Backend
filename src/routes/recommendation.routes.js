import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import {
	addCustomTag,
	removeTag,
	getUserFeed,
	getUserTags,
} from "../controllers/recommendation.controller.js";

const router = Router();

router.use(verifyJwt);

router
	.route("/tags/:type")
	.get(getUserTags)
	.post(addCustomTag)
	.delete(removeTag);

router.route("/feed").get(getUserFeed);

export default router;
