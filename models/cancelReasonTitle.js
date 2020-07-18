const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const cancelReasonTitleSchema = new Schema({
  name: {
    type: String,
    unique: true,
    required: true
  },
  type: {
    type: String,
    required: true
  },
  isAdmin: {
    type: Boolean,
    required: true
  },
  isSupervisor: {
    type: Boolean,
    required: true
  }
});

module.exports = mongoose.model('CancelReasonTitle', cancelReasonTitleSchema);