const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const bannedUserSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  ip: {
    type: String,
    required: true
  },
  banDate: {
    type: Date,
    default: Date.now,
    required: true
  },
  banExpiryDate: {
    type: Date,
    required: false
  }  
});

//bannedUserSchema.index({capabilityDescription: 1, supplier: 1}, {unique: true});
module.exports = mongoose.model('BannedUser', bannedUserSchema);