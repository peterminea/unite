const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const buyerSchema = new Schema({
  organizationName: {
    type: String,
    required: true
  },
  organizationUniteID: {
    type: Schema.Types.ObjectId,
    required: true
  },
  contactName: {
    type: String,
    required: true
  },
  emailAddress: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  balance: {
    type: Number,    
    default: 0
  },
  deptAgencyGroup: {
    type: String,
    required: false
  },
  qualification: {
    type: String,
    required: false
  },  
  country: {
    type: String,
    required: true
  }
});

module.exports = mongoose.model('Buyer', buyerSchema);