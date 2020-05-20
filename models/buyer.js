const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");
const Schema = mongoose.Schema;

const buyerSchema = new Schema({
  organizationName: {
    type: String,
    unique: true,
    required: true
  },
  organizationUniteID: {
    type: String,
    unique: true,
    required: true
  },
  contactName: {
    type: String,
    required: true
  },
  emailAddress: {
    type: String,
    unique: true,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  resetPasswordToken: {
    type: String,
    required: false
  },
  resetPasswordExpires: {
    type: Date,
    required: false
    //,  default: Date.now() + 43200000
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

buyerSchema.plugin(passportLocalMongoose);
module.exports = mongoose.model('Buyer', buyerSchema);