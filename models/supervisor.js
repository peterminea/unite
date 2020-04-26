const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const supervisorSchema = new Schema({
  organisationName: {
    type: String,
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
  country: {
    type: String,
    required: true
  },
    // URLs will be directing to a download page. Suppliers must upload a file, and it will be converted to an URL.
  certificatesUrls: {
    type: [String],
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
    type: [String],
    required: false
  },
  
  // UNITE Agreements
  UNITETermsAndConditons: {
    type: Boolean, // Force to true with popup
    required: true
  },
  antibriberyAgreement: {
    type: Boolean, // Force to true with Popup
    required: true
  }
});

module.exports = mongoose.model('Supervisor', supervisorSchema);