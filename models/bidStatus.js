const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const bidStatusSchema = new Schema({
  value: {
    type: Number,
    unique: true,
    required: true,
    validate(value) {
      if(value < 0 || value > 6) {
        throw new Error('Invalid bid status.');
      }
    }
  },
  name: {
    type: String,
    required: true
  }
});

module.exports = mongoose.model('BidStatus', bidStatusSchema);