import mongoose from 'mongoose';

const riskSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  doseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Medicine',
    required: true,
  },
  doseLogId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DoseLog',
    required: true,
  },
  riskDetails: {
    type: Object,
    required: true,
  },
  // Indicates whether a notification/action based on this risk was sent
  sent: {
    type: Boolean,
    default: false,
  },
  // Timestamp of when the notification/action was sent
  timeAtWhichSent: {
    type: Date,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Risk = mongoose.model('Risk', riskSchema);

export default Risk;