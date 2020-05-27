const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const bidRequestSchema = new Schema({
  itemDescription: {
    type: String,
    required: true
  },
  productsServicesOffered: {
    type: [String],
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
    validate(value) {
      if(value < 0) {
        throw new Error('Please specify a valid number.');
      }
    },
    required: true
  },
  currency: {
    type: String,
    required: true,
  },
  orderedProducts: [String],//Schema.Types.Mixed,
  amountList: {
    type: [Number],
    required: true
  },
  priceList: {
    type: [Number],
    required: true
  },
  /*{
    type: [String],
    required: true
  },*/
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
    required: true,
    validate(value) {
      if(value < 0 || value >= 7) {
        throw new Error('Status must be an integer from 0 to 6.');
      }
    },
    default: 0
  },
  price: {
    type: Number,
    required: true,
    default: 1,
    validate(value) {
      if(value < 1) {
        throw new Error('Price must be a strictly positive value.');
      }
    }
  },
  createdAt: {
    type: Date,
    default: Date.now()
  },
  updatedAt: {
    type: Date,
    default: Date.now()
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
bidRequestSchema.orderedProducts = {
  products: {
    type: [String],
    required: true
  },
  amounts: {
    type: [Number],
    required: true
  },
  prices: {
    type: [Number],
    required: true
  }
};*/

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

module.exports = mongoose.model('BidRequest', bidRequestSchema);