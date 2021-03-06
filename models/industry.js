const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const industrySchema = new Schema({
  name: {
    type: String,
    unique: true,
    required: true
  }
});

industrySchema.index({name: 1}, {unique: true});
module.exports = mongoose.model('Industry', industrySchema);