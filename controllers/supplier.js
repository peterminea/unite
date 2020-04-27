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
      requestsCount: requestsCount,
      successMessage: req.flash("success")
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

exports.getSignUp = (req, res) => {
  if (!req.session.supplier)
    return res.render("supplier/sign-up", {
      errorMessage: req.flash("error")
    });
  else res.redirect("/supplier");
};

exports.postSignUp = (req, res) => {
  if (req.body.emailAddress) {
    const email = req.body.emailAddress;
    const email_str_arr = email.split("@");
    const domain_str_location = email_str_arr.length - 1;
    const final_domain = email_str_arr[domain_str_location];

    if (final_domain == 'gmail.com' || final_domain == 'hotmail.com'
      || final_domain.includes("outlook.com") || final_domain.includes('yandex.com') || final_domain.includes('yahoo.com')
      || final_domain.includes("gmx")) {
      req.flash("error", "E-mail address has not a custom company domain.")
      res.redirect("/supplier/sign-up");
    } else {
      if (req.password < 6) {
        req.flash("error", "Password must have 6 characters at least.")
        res.redirect("/supplier/sign-up");
      } else {
        const supplier = new Supplier({
          companyName: req.body.companyName,
          directorsName: req.body.directorsName,
          contactName: req.body.contactName,
          title: req.body.title,
          emailAddress: req.body.emailAddress,
          password: req.body.password,
          registrationCompany: req.body.registrationCompany,
          companyAddress: req.body.companyAddress,
          storageLocation: req.body.storageLocation,
          contactMobileNumber: req.body.contactMobileNumber,
          country: req.body.country,
          industry: req.body.industry,
          employeeNumbers: req.body.employeeNumbers,
          lastYearTurnover: req.body.lastYearTurnover,
          website: req.body.website,
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
          UNITETermsAndConditions: true,
          antibriberyAgreement: true
        });

        supplier.save().then(doc => {
          req.session.supplier = doc;
          req.session.id = doc._id;
          return req.session.save();
        }).then(() => {
          req.flash('success', 'Supplier signed up successfully!');
          return res.redirect("/supplier");
        }).catch(console.error);
      }
    }
  }
}

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
  Supplier.findOne({ _id: req.body._id }, (doc) => {
    doc.companyName = req.body.companyName;
    doc.directorsName = req.body.directorsName;
    doc.contactName = req.body.contactName;
    doc.title = req.body.title;
    doc.emailAddress = req.body.emailAddress;
    doc.password = req.body.password;
    doc.companyRegistrationNo = req.body.companyRegistrationNo;
    doc.registrationCompany = req.body.registrationCompany;
    doc.balance = req.body.balance;
    doc.companyAddress = req.body.companyAddress;
    doc.storageLocation = req.body.storageLocation;
    doc.contactMobileNumber = req.body.contactMobileNumber;
    doc.country = req.body.country;
    doc.industry = req.body.industry;
    doc.employeeNumbers = req.body.employeeNumbers;
    doc.lastYearTurnover = req.body.lastYearTurnover;
    doc.website = req.body.website;
    doc.commodities = req.body.commodities;
    doc.capabilityDescription = req.body.capabilityDescription;
    doc.relevantExperience = req.body.relevantExperience;
    doc.supportingInformation = req.body.supportingInformation;
    doc.certificatesUrls = req.body.certificatesUrls;
    doc.antibriberyPolicyUrl = req.body.antibriberyPolicyUrl;
    doc.environmentPolicyUrl = req.body.environmentPolicyUrl;
    doc.qualityManagementPolicyUrl = req.body.qualityManagementPolicyUrl;
    doc.occupationalSafetyAndHealthPolicyUrl = req.body.occupationalSafetyAndHealthPolicyUrl;
    doc.otherRelevantFilesUrls = req.body.otherRelevantFilesUrls;

    return doc.save();
  }).then(doc => {
    req.session.supplier = doc;
    req.session.id = doc._id;
    return req.session.save();
  }).then(() => {
    req.flash('success', 'Supplier details updated successfully!');
    return res.redirect("/supplier");
  }).catch(console.error);
}