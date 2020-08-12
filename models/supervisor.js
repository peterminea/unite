const mongoose = require("mongoose");
//const passportLocalMongoose = require("passport-local-mongoose");
const Schema = mongoose.Schema;
const validator = require('validator');

const supervisorSchema = new Schema({
  role: {
    type: String,
    required: true
  },
   avatar: {
    type: String,
    required: true
  },
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
  ipv4: {
    type: String,
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
  country: {
    type: String,
    required: true
  },  
  website: {
    type: String,
    required: true
  },
  facebookURL: {
    type: String,
    required: false
  },
  instagramURL: {
    type: String,
    required: false
  },
  twitterURL: {
    type: String,
    required: false
  },
  linkedinURL: {
    type: String,
    required: true
  },
  otherSocialMediaURL: {
    type: String,
    required: false
  },
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
  certificatesIds: {
    type: String,
    required: false
  },
  antibriberyPolicyId: {
    type: String,
    required: false
  },
  environmentPolicyId:{
    type: String,
    required: false
  },
  qualityManagementPolicyId: {
    type: String,
    required: false
  },  
  occupationalSafetyAndHealthPolicyId: {
    type: String,
    required: false
  },
  otherRelevantFilesIds:  {
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

//supervisorSchema.plugin(passportLocalMongoose);
supervisorSchema.index({organizationName: 1, organizationUniteID: 1}, {unique: true});
module.exports = mongoose.model('Supervisor', supervisorSchema);