const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const supplierSchema = new Schema({
  companyName: {
    type: String,
    required: true
  },
  directorsName: {
    type: String,
    required: false
  },
  contactName: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  emailAddress: {
    type: String,
    required: true // Check @gmail.com or @hotmail.com. Ensure it is company domain
  },
  password: {
    type: String,
    required: true
  },
  companyRegistrationNo:{
    type: String,
    required: true
  },
  registrationCompany: {
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
  storageLocation: {
    type: String,
    required: false
  },
  contactMobileNumber: {
    type: String,
    required: false
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
    type: Number, //Euro
    required: true
  },
  website: {
    type: String,
    required: false
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
    required: false
  },
  otherSocialMediaURL: {
    type: String,
    required: false
  },
  commodities: {
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
    type: Boolean, // Force to true with Popup
    required: true
  }
});

module.exports = mongoose.model('Supplier', supplierSchema);