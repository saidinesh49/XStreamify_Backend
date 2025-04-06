import mongoose, { Schema } from "mongoose";

const notificationSchema = new Schema(
  {
    recipient: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: ["PARENT_REQUEST", "REQUEST_ACCEPTED", "REQUEST_REJECTED"],
      required: true,
    },
    read: {
      type: Boolean,
      default: false,
    },
    message: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

export const Notification = mongoose.model("Notification", notificationSchema); 