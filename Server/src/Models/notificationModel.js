import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    medicineId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Medicine",
      default: null,
    },
    type: {
      type: String,
      enum: ["dose_reminder", "missed_dose", "achievement", "insight", "refill"],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    read: {
      type: Boolean,
      default: false,
    },
    actionRequired: {
      type: Boolean,
      default: false,
    },
    actionType: {
      type: String,
      enum: ["take_dose", "confirm_taken", "acknowledge", null],
      default: null,
    },
    relatedDoseLogId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DoseLog",
      default: null,
    },
    scheduledFor: {
      type: Date,
      required: true,
    },
    sentAt: {
      type: Date,
      default: null,
    },
    acknowledgedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Index for efficient queries
notificationSchema.index({ userId: 1, read: 1, scheduledFor: -1 });
notificationSchema.index({ userId: 1, type: 1 });

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;