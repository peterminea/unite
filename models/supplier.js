const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");
const Schema = mongoose.Schema;

const supplierSchema = new Schema({
  companyName: {
    type: String,
    unique: true,
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
    required: true // Check @gmail.com or @hotmail.com. Ensure it is company domain
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
    //,    default: Date.now() + 43200000
  },  
  registeredCountry: {
    type: String,
    required: true
  },
  balance: {
    type: Number,
    default: 0
  },
  companyAddress: {
    type: String,
    required: true
  },
  areaCovered: {
    type: String,
    required: true
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
    required: true
  },
  lastYearTurnover: {
    type: Number,
    required: true
  },
  website: {
    type: String,
    required: false
  },
  productsServicesOffered: {
    type: String,
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
  certificatesUrls: {
    type: String,
    required: false
  },
  antibriberyPolicyUrl: {
    type: String,
    required: false
  },
  environmentPolicyUrl:{
    type: String,
    required: false
  },
  qualityManagementPolicyUrl: {
    type: String,
    required: false
  },  
  occupationalSafetyAndHealthPolicyUrl: {
    type: String,
    required: false
  },
  otherRelevantFilesUrls:  {
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
  }
});

supplierSchema.plugin(passportLocalMongoose);
module.exports = mongoose.model('Supplier', supplierSchema);