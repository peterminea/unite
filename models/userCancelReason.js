const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userCancelReasonSchema = new Schema({
  title: {//Drop-down list or radio buttons - Why? Bribery, personal choice, other platform, business issues.
    type: String,
    required: true
  },
  reason: {//Textarea - Details on the reason why you are leaving UNITE.
    type: String,
    required: true
  },
  userType: {//Are you a Buyer, Supervisor, Supplier?
    type: String,
    required: true
  },
  userName: {//What is your name?
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    required: true
  }
});

module.exports = mongoose.model('UserCancelReason', userCancelReasonSchema);