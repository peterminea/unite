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

/*
Bid Request Status Legend:

00 -> Buyer requested.
01 -> Supplier sent information.
02 -> Buyer sent information-request.
03 -> Buyer sent buy-requests.
04 -> Supplier sent "sending-done".
05 -> Buyer completes the order, delivery process successful.
06 -> Buyer cancelled the request.
07 -> Supplier cancelled the request.
*/

module.exports = mongoose.model('BidStatus', bidStatusSchema);