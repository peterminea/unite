const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const productserviceSchema = new Schema({
  productName: {
    type: String,
    unique: true,
    required: true
  },
  productImage: {
    type: String,//Path
    required: false
  },
  price: {
    type: Number,
    default: 1,
    validation(value) {
      if(value < 0) {
        throw new Error('Price cannot be negative.');
      }
    },
    required: true
  },
  currency: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    default: 1,
    validation(value) {
      if(value < 1) {
        throw new Error('Please enter a valid amount.');
      }
    },
    required: true
  },
  totalPrice: {
    type: Number,
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

productserviceSchema.index({productName: 1, supplier: 1}, {unique: true});
module.exports = mongoose.model('ProductService', productserviceSchema);