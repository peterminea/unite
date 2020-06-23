const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const adminCancelReasonTitleSchema = new Schema({
    name: {
    type: String,
    unique: true,
    required: true
  }
});

module.exports = mongoose.model('AdminCancelReasonTitle', adminCancelReasonTitleSchema);