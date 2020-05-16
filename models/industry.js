const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const industrySchema = new Schema({
  name: {
    type: String,
    required: true
  }
});

module.exports = mongoose.model('Industry', industrySchema);