const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userCancelReasonTitleSchema = new Schema({
    name: {
    type: String,
    unique: true,
    required: true
  }
});

module.exports = mongoose.model('UserCancelReasonTitle', userCancelReasonTitleSchema);