const mongoose = require("mongoose");
//const passportLocalMongoose = require("passport-local-mongoose");
const Schema = mongoose.Schema;
const validator = require('validator');

const buyerSchema = new Schema({
  role: {
    type: String,
    required: true
  },
  avatar: {
    type: String,
    required: false
  },
  organizationName: {
    type: String,
    unique: true,
    required: true
  },
  organizationUniteID: {
    type: String,
    //unique: true,
    required: true
  },
  contactName: {
    type: String,
    required: true
  },
  emailAddress: {
    type: String,
    unique: true,
    trim: true,
    lowercase: true,
    validate(value) {
    if(!validator.isEmail(value)) {
      throw new Error('Invalid e-mail address');
    }
  },
    required: true
  },
  password: {
    type: String,
    minLength: 6,
    trim: true,
    validate(value) {
      if(value.toLowerCase().includes('password')) {
        throw new Error('Invalid token in the password');
      }
    },
    required: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isActive: {
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
    //,default: Date.now() + 43200000
  },
  contactMobileNumber: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  balance: {
    type: Number,
    validate(value) {
      if(value < 0) {
        throw new Error('Balance must be 0 or positive');
      }
    },
    required: true,
    default: 0
  },
  currency: {
    type: String,
    required: true,
    default: 'EUR'
  },
  deptAgencyGroup: {
    type: String,
    required: true
  },
  qualification: {
    type: String,
    required: true
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
  },
  createdAtFormatted: {
    type: String,
    required: true
  },
  updatedAtFormatted: {
    type: String,
    required: false
  }
});

//buyerSchema.plugin(passportLocalMongoose);
buyerSchema.index({organizationName: 1, organizationUniteID: 1}, {unique: true});
module.exports = mongoose.model('Buyer', buyerSchema);