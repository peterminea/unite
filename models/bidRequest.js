const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const bidRequestSchema = new Schema({
  itemDescription: {
    type: String,
    required: true
  },
  commodityList: {
    type: String,
    required: true
  },
  itemDescriptionLong: {
    type: String,
    required: true
  },
  itemDescriptionUrl: {
    type: String,
    required: false
  },
  amount: {
    type: Number,
    required: true
  },
  deliveryLocation: {
    type: String,
    required: true
  },
  deliveryRequirements: {
    type: String,
    required: true,
  },
  complianceRequirements: {
    type: String,
    required: true
  },
  complianceRequirementsUrl: {
    type: String,
    required: false
  },
  otherRequirements: {
    type: String,
    required: false
  },
  status: {
    type: Number,
    default: 0
  },
  price: {
    type: Number,
    required: false
  },
  buyer: {
    type: Schema.Types.ObjectId, // Buyer's object id -> It will be generated from current session
    required: true
  },
  supplier: {
    type: Schema.Types.ObjectId, // Supplier's object id -> It will be generated from current session
    required: true
  }
});

/*
Bid Request Status

-2 -> Buyer canceled the request
-1 -> Supplier canceled the request
00 -> Buyer requested
01 -> Supplier sent information
02 -> Buyer sent information-request
03 -> Buyer sent buy-requests
04 -> Supplier sent "sending-done"
05 -> Buyer submitted all process are successful

*/

module.exports = mongoose.model('BidRequest', bidRequestSchema);