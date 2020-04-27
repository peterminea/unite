const bcrypt = require("bcryptjs");

const Supplier = require("../models/supplier");
const Buyer = require("../models/buyer");
const BidRequest = require("../models/bidRequest");
const Message = require("../models/message");

exports.getIndex = (req, res) => {
  const supplier = req.session.supplier;

  BidRequest.find({ supplier: supplier._id }).then(requests => {
    const requestsCount = requests.length;

    res.render("supplier/index", {
      supplier: supplier,
      requestsCount: requestsCount
    });
  }).catch(console.error);
};

exports.getSignIn = (req, res) => {
  if (!req.session.supplier)
    return res.render("supplier/sign-in", {
      errorMessage: req.flash("error")
    });
  else res.redirect("/supplier");
};

exports.postSignIn = (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  if (!email) res.redirect("/supplier/sign-in");
  else {
    Supplier.findOne({ emailAddress: email }, (err, doc) => {
      if (err) return console.error(err);

      if (!doc) {
        req.flash("error", "Invalid e-mail address or password");
        return res.redirect("/supplier/sign-in");
      }

      bcrypt
        .compare(password, doc.password)
        .then(doMatch => {
          if (doMatch) {
            req.session.supplier = doc;
            req.session.id = doc._id;
            return req.session.save();
          } else {
            req.flash("error", "Invalid e-mail address or password");
            res.redirect("/supplier/sign-in");
          }
        })
        .then(err => {
          if (err) return console.error(err);
          res.redirect("/supplier/");
        })
        .catch(console.error);
    });
  }
};

exports.getProfile = (req, res) => {
  res.render("supplier/profile", { profile: req.session.supplier });
};

exports.getBidRequests = (req, res) => {
  const supplier = req.session.supplier;

  BidRequest.find({ supplier: supplier._id }).then(requests => {
    res.render("supplier/bid-requests", {
      supplier: supplier,
      requests: requests
    });
  }).catch(console.error);
};

exports.getBidRequest = (req, res) => {
  const supplier = req.session.supplier;
  let request;
  const id = req.params.id;

  BidRequest.findOne({ _id: id }).then(_request => {
    request = _request;
    return Buyer.findOne({ _id: request.buyer });
  }).then(buyer => {
    res.render("supplier/bid-request", {
      supplier: supplier,
      request: request,
      buyer: buyer
    })
  }).catch(console.error);
};

exports.postBidRequest = (req, res) => {
  if (req.body.message) {
    const newMessage = new Message({
      to: req.body.to,
      from: req.body.from,
      message: req.body.message
    });

    newMessage.save().then(result => {
      res.render(req.originalUrl);
    }).catch(console.error);
  }
};


exports.postProfile = (req, res) => {

  const newSupplier = new Supplier({
    _id: req.body._id,
    companyName: req.body.companyName,
    directorsName: req.body.directorsName,
    contactName: req.body.contactName,
    title: req.body.title,
    emailAddress: req.body.emailAddress,
    password: req.body.password,
    companyRegistrationNo: req.body.companyRegistrationNo,
    registrationCompany: req.body.registrationCompany,
    balance: req.body.balance,
    companyAddress: req.body.companyAddress,
    storageLocation: req.body.storageLocation,
    contactMobileNumber: req.body.contactMobileNumber,
    country: req.body.country,
    industry: req.body.industry,
    employeeNumbers: req.body.employeeNumbers,
    lastYearTurnover: req.body.lastYearTurnover,
    website: req.body.website,
    facebookURL: req.body.facebookURL,
    instagramURL: req.body.instagramURL,
    twitterURL: req.body.twitterURL,
    linkedinURL: req.body.linkedinURL,
    otherSocialMediaURL: req.body.otherSocialMediaURL,
    commodities: req.body.commodities,
    capabilityDescription: req.body.capabilityDescription,
    relevantExperience: req.body.relevantExperience,
    supportingInformation: req.body.supportingInformation,
    certificatesUrls: req.body.certificatesUrls,
    antibriberyPolicyUrl: req.body.antibriberyPolicyUrl,
    environmentPolicyUrl: req.body.environmentPolicyUrl,
    qualityManagementPolicyUrl: req.body.qualityManagementPolicyUrl,
    occupationalSafetyAndHealthPolicyUrl: req.body.occupationalSafetyAndHealthPolicyUrl,
    otherRelevantFilesUrls: req.body.otherRelevantFilesUrls,
    UNITETermsAndConditions: req.body.UNITETermsAndConditions,
    antibriberyAgreement: req.body.antibriberyAgreement
  });

  return newSupplier.save().then(result => {
    req.flash('success', 'Supplier details updated successfully!');
    return res.redirect("/supplier/profile");
  }).catch(console.error);
}