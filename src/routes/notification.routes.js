import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import {
  getUserNotifications,
  markNotificationAsRead,
  deleteNotification,
  sendParentRequest,
  respondToParentRequest,
  getUnreadNotificationCount,
  getUsernameSuggestions,
} from "../controllers/notification.controller.js";

const router = Router();

router.use(verifyJwt);

router.route("/").get(getUserNotifications);
router.route("/count").get(getUnreadNotificationCount);
router.route("/:notificationId/read").patch(markNotificationAsRead);
router.route("/:notificationId").delete(deleteNotification);
router.route("/parent-request").post(sendParentRequest);
router.route("/parent-request/:notificationId/respond").post(respondToParentRequest);
router.route("/username-suggestions").get(getUsernameSuggestions);

export default router; 