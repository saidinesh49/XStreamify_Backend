import { Notification } from "../models/notification.model.js";
import { Recommendation } from "../models/recommendation.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Get all notifications for the current user
const getUserNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ recipient: req.user._id })
    .populate("sender", "username fullName avatar")
    .sort("-createdAt");

  return res
    .status(200)
    .json(
      new ApiResponse(200, notifications, "Notifications fetched successfully")
    );
});

// Mark notification as read
const markNotificationAsRead = asyncHandler(async (req, res) => {
  const { notificationId } = req.params;

  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, recipient: req.user._id },
    { read: true },
    { new: true }
  );

  if (!notification) {
    throw new ApiError(404, "Notification not found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, notification, "Notification marked as read")
    );
});

// Delete notification
const deleteNotification = asyncHandler(async (req, res) => {
  const { notificationId } = req.params;

  const notification = await Notification.findOneAndDelete({
    _id: notificationId,
    recipient: req.user._id,
  });

  if (!notification) {
    throw new ApiError(404, "Notification not found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, {}, "Notification deleted successfully")
    );
});

// Send parent request
const sendParentRequest = asyncHandler(async (req, res) => {
  const { childUserId } = req.body;

  if (!childUserId) {
    throw new ApiError(400, "Child user ID is required");
  }

  // Check if child user exists
  const childUser = await User.findById(childUserId);
  if (!childUser) {
    throw new ApiError(404, "User not found");
  }

  // Check if request already exists
  const existingRequest = await Notification.findOne({
    sender: req.user._id,
    recipient: childUserId,
    type: "PARENT_REQUEST",
  });

  if (existingRequest) {
    throw new ApiError(400, "Request already sent to this user");
  }

  // Check if already linked
  const existingLink = await Recommendation.findOne({
    user: childUserId,
    parentUser: req.user._id,
  });

  if (existingLink) {
    throw new ApiError(400, "Already linked as parent to this user");
  }

  // Create notification
  const notification = await Notification.create({
    recipient: childUserId,
    sender: req.user._id,
    type: "PARENT_REQUEST",
    message: `${req.user.username} wants to be your parent account to help manage content recommendations.`,
  });

  return res
    .status(201)
    .json(
      new ApiResponse(201, notification, "Parent request sent successfully")
    );
});

// Respond to parent request
const respondToParentRequest = asyncHandler(async (req, res) => {
  const { notificationId } = req.params;
  const { accept } = req.body;

  if (accept === undefined) {
    throw new ApiError(400, "Accept parameter is required (true/false)");
  }

  // Find the notification
  const notification = await Notification.findOne({
    _id: notificationId,
    recipient: req.user._id,
    type: "PARENT_REQUEST",
  }).populate("sender", "username");

  if (!notification) {
    throw new ApiError(404, "Parent request notification not found");
  }

  // Process the response
  if (accept) {
    // Link parent to child
    await Recommendation.findOneAndUpdate(
      { user: req.user._id },
      { parentUser: notification.sender._id },
      { upsert: true }
    );

    // Create acceptance notification for parent
    await Notification.create({
      recipient: notification.sender._id,
      sender: req.user._id,
      type: "REQUEST_ACCEPTED",
      message: `${req.user.username} has accepted your parent account request.`,
    });
  } else {
    // Create rejection notification for parent
    await Notification.create({
      recipient: notification.sender._id,
      sender: req.user._id,
      type: "REQUEST_REJECTED",
      message: `${req.user.username} has declined your parent account request.`,
    });
  }

  // Delete the original request notification
  await Notification.findByIdAndDelete(notificationId);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        {},
        `Parent request ${accept ? "accepted" : "declined"} successfully`
      )
    );
});

// Get unread notification count
const getUnreadNotificationCount = asyncHandler(async (req, res) => {
  const count = await Notification.countDocuments({
    recipient: req.user._id,
    read: false,
  });

  return res
    .status(200)
    .json(
      new ApiResponse(200, { count }, "Unread notification count fetched")
    );
});

// Get username suggestions for parent requests
const getUsernameSuggestions = asyncHandler(async (req, res) => {
  const { query } = req.query;
  console.log("backend recieved username for sug: ",query);
  
  if (!query || query.length < 2) {
    return res
      .status(200)
      .json(
        new ApiResponse(200, [], "Please enter at least 2 characters")
      );
  }
  
  // Find users whose username or fullName contains the query
  // Exclude the current user from results
  const users = await User.find({
    $and: [
      { _id: { $ne: req.user._id } },
      {
        $or: [
          { username: { $regex: query, $options: 'i' } },
          { fullName: { $regex: query, $options: 'i' } }
        ]
      }
    ]
  })
  .select("username fullName avatar _id")
  .limit(5);
  
  return res
    .status(200)
    .json(
      new ApiResponse(200, users, "Username suggestions fetched successfully")
    );
});

export {
  getUserNotifications,
  markNotificationAsRead,
  deleteNotification,
  sendParentRequest,
  respondToParentRequest,
  getUnreadNotificationCount,
  getUsernameSuggestions,
}; 