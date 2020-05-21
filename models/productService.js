const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const productserviceSchema = new Schema({
  productName: {
    type: String,
    required: true
  },
  productPrice: {
    type: Number,
    default: 1,
    required: true
  },
  supplier: {
    type: Schema.Types.ObjectId, // Supplier's object id -> It will be generated from current session
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now()
  },
  updatedAt: {
    type: Date,
    default: Date.now()
  }
});

module.exports = mongoose.model('ProductService', productserviceSchema);