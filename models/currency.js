const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const currencySchema = new Schema({
  name: {
    type: String,
    unique: true,
    required: true
  },
  value: {
    type: String,
    required: true
  }
});

module.exports = mongoose.model('Currency', currencySchema);