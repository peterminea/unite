const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const bidCancelReasonTitleSchema = new Schema({
  name: {
    type: String,
    unique: true,
    required: true
  }
});

module.exports = mongoose.model('BidCancelReasonTitle', bidCancelReasonTitleSchema);