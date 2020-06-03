const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");
const Schema = mongoose.Schema;
const validator = require('validator');

const supervisorSchema = new Schema({
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
  country: {
    type: String,
    required: true
  },  
    // URLs will be directing to a download page. Suppliers must upload a file, and it will be converted to an URL.
  certificates: {
    type: String,
    required: false
  },
  antibriberyPolicy: {
    type: String,
    required: false
  },
  environmentPolicy:{
    type: String,
    required: false
  },
  qualityManagementPolicy: {
    type: String,
    required: false
  },  
  occupationalSafetyAndHealthPolicy: {
    type: String,
    required: false
  },
  otherRelevantFiles:  {
    type: String,
    required: false
  },
   //UNITE Agreements:
  UNITETermsAndConditions: {
    type: Boolean, // Force to true with popup
    required: true
  },
  antibriberyAgreement: {
    type: Boolean, // Force to true with popup
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

//supervisorSchema.plugin(passportLocalMongoose);
supervisorSchema.index({organizationName: 1, organizationUniteID: 1}, {unique: true});
module.exports = mongoose.model('Supervisor', supervisorSchema);