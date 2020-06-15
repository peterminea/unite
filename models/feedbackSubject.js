const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const feedbackSubjectSchema = new Schema({
  name: {
    type: String,
    unique: true,
    required: true
  }
});

module.exports = mongoose.model('FeedbackSubject', feedbackSubjectSchema);