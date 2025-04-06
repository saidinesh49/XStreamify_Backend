import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import {
	addCustomTag,
	removeTag,
	getUserFeed,
	getUserTags,
	linkChildToParent,
	unlinkChildFromParent,
	getChildrenAccounts,
	getChildTags,
	updateChildExcludedTags
} from "../controllers/recommendation.controller.js";

const router = Router();

router.use(verifyJwt);

router
	.route("/tags/:type")
	.get(getUserTags)
	.post(addCustomTag)
	.delete(removeTag);

router.route("/feed").get(getUserFeed);

// Parent-child relationship routes
router.route("/parent/link-child").post(linkChildToParent);
router.route("/parent/unlink-child/:childUserId").delete(unlinkChildFromParent);
router.route("/parent/children").get(getChildrenAccounts);
router.route("/parent/child/:childUserId/tags").get(getChildTags);
router.route("/parent/child/:childUserId/excluded-tags").post(updateChildExcludedTags);

export default router;
