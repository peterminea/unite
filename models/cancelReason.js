const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const cancelReasonSchema = new Schema({
  type: {
    type: String,
    required: true
  },
  reason: {
    type: String,
    required: true
  },
  userType: {
    type: String,
    required: true    
  },
  userName: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    required: true
  }
});

module.exports = mongoose.model('CancelReason', cancelReasonSchema);