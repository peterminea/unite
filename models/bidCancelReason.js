const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const bidCancelReasonSchema = new Schema({
  title: {//Drop-down list or radio buttons - Why? Better offer somewhere else, too expensive price.
    type: String,
    required: true
  },
  reason: {//Textarea - Details on the reason why you are cancelling an order.
    type: String,
    required: true
  },
  userType: {//Are you a Buyer, a Supplier?
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

module.exports = mongoose.model('BidCancelReason', bidCancelReasonSchema);