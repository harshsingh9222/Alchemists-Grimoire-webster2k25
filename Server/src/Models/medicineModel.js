import mongoose from "mongoose";

const medicineSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    medicineName: {
      type: String,
      required: true,
      trim: true,
    },
    dosage: {
      type: String,
      required: true,
    },
    frequency: {
      type: String,
      enum: ["daily", "weekly", "as-needed"],
      required: true,
    },
    times: {
      type: [String], // Example: ["08:00", "14:00", "20:00"]
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      default: null,
    },
    notes: {
      type: String,
      trim: true,
    },
    // Google calendar event id (if created)
    googleEventId: {
      type: String,
      default: null,
    },
    googleCalendarCreatedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

const Medicine = mongoose.model("Medicine", medicineSchema);

export default Medicine;