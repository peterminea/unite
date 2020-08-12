const mongoose = require("mongoose");
//const passportLocalMongoose = require("passport-local-mongoose");
const Schema = mongoose.Schema;
const validator = require('validator');

const supplierSchema = new Schema({
  role: {
    type: String,
    required: true
  },
   avatar: {
    type: String,
    required: true
  },
  ipv4: {
    type: String,
    required: true
  },
  companyName: {
    type: String,
    unique: true,
    index: true,
    required: true
  },
  directorsName: {
    type: String,
    required: true
  },
  contactName: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  companyRegistrationNo: {
    type: String,
    required: true
  },
  emailAddress: {
    type: String,
    unique: true,
    index: true,
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
  registeredCountry: {
    type: String,
    required: true
  },
  balance: {
    type: Number,
    validate(value) {
      if(value < 0) {
        throw new Error('Balance must be 0 or positive.');
      }
    }
  },
  currency: {
    type: String,
    required: true
  },
  companyAddress: {
    type: String,
    required: true
  },
  areaCovered: {
    type: String,
    required: false
  },
  contactMobileNumber: {
    type: String,
    required: true
  },
  country: {
    type: String,
    required: true
  },
  industry: {
    type: String,
    required: true
  },
  employeeNumbers: {
    type: Number,
    validate(value) {
      if(value < 1) {
        throw new Error('Please enter a valid number of employees.')
      }
    },
    required: true
  },
  lastYearTurnover: {
    type: Number,
    validate(value) {
      if(value < 1) {
        throw new Error('Please enter a valid number for Turnover.')
      }
    },
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
  productsServicesOffered: [{//String array, actually.
    type: String,
    required: true
  }],
  pricesList: [{
    type: Number,
    required: true
  }],
  currenciesList: [{
    type: String,
    required: true
  }],
  amountsList: [{
    type: Number,
    required: true
  }],
  productImagesList: [{
    type: String,
    required: false
  }],
  totalSupplyPrice: {
    type: String,
    required: true
  },
  totalSupplyAmount: {
    type: Number,
    required: true
  },
  capabilityDescription: {
    type: String,
    required: true
  },
  relevantExperience: {
    type: String,
    required: true
  },
  supportingInformation: {
    type: String,
    required: false
  },  
  // URL's going to download page. Supplier uploads a file and it will be converted to URL
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
  // UNITE Agreements
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
// db.collection.createIndex
supplierSchema.index( { "companyName": 1, "emailAddress": 1 }, { unique: true } );
//supplierSchema.plugin(passportLocalMongoose);
module.exports = mongoose.model('Supplier', supplierSchema);