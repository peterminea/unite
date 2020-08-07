const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const validator = require('validator');

const feedbackSchema = new Schema({
  userName: {
    type: String,
    required: true
  },
  userEmail: {
    type: String,
    trim: true,
    lowercase: true,
    validate(value) {
    if(!validator.isEmail(value)) {
      throw new Error('Invalid e-mail address');
    }
  },
    required: true
  },
  subject: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now()
  }
});

module.exports = mongoose.model('Feedback', feedbackSchema);