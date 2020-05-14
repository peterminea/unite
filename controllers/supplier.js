const bcrypt = require("bcryptjs");
const Supplier = require("../models/supplier");
const Buyer = require("../models/buyer");
const BidRequest = require("../models/bidRequest");
const Message = require("../models/message");
const nodemailer = require('nodemailer');
const Token = require('../models/supplierToken');

exports.getIndex = (req, res) => {
  const supplier = req.session.supplier;

  BidRequest.find({ supplier: supplier._id })
    .then(requests => {
      const requestsCount = requests.length;

      res.render("supplier/index", {
        supplier: supplier,
        requestsCount: requestsCount,
        successMessage: req.flash("success")
      });
    })
    .catch(console.error);
};

exports.postConfirmation = function (req, res, next) {
    req.assert('email', 'Email is not valid').isEmail();
    req.assert('email', 'Email cannot be blank').notEmpty();
    req.assert('token', 'Token cannot be blank').notEmpty();
    req.sanitize('email').normalizeEmail({ remove_dots: false });
 
    // Check for validation errors    
    var errors = req.validationErrors();
    if (errors) return res.status(400).send(errors);
 
    // Find a matching token
    Token.findOne({ token: req.body.token }, function (err, token) {
        if (!token) return res.status(400).send({ type: 'not-verified', msg: 'We were unable to find a valid token. Your token may have expired.' });
 
        // If we found a token, find a matching user
        Supplier.findOne({ _id: token._userId, email: req.body.email }, function (err, user) {
            if (!user) return res.status(400).send({ msg: 'We were unable to find a user for this token.' });
            if (user.isVerified) return res.status(400).send({ type: 'already-verified', msg: 'This user has already been verified.' });
 
            // Verify and save the user
            user.isVerified = true;
            user.save(function (err) {
                if (err) { return res.status(500).send({ msg: err.message }); }
                res.status(200).send("The account has been verified. Please log in.");
            });
        });
    });
};


exports.postResendToken = function (req, res, next) {
    req.assert('email', 'Email is not valid').isEmail();
    req.assert('email', 'Email cannot be blank').notEmpty();
    req.sanitize('email').normalizeEmail({ remove_dots: false });
 
    // Check for validation errors    
    var errors = req.validationErrors();
    if (errors) return res.status(400).send(errors);
 
    Supplier.findOne({ email: req.body.email }, function (err, user) {
        if (!user) return res.status(400).send({ msg: 'We were unable to find a user with that email.' });
        if (user.isVerified) return res.status(400).send({ msg: 'This account has already been verified. Please log in.' });
 
        // Create a verification token, save it, and send email
        var token = new Token({ _userId: user._id, token: crypto.randomBytes(16).toString('hex') });
 
        // Save the token
        token.save(function (err) {
            if (err) { return res.status(500).send({ msg: err.message }); }
 
            // Send the email
            var transporter = nodemailer.createTransport({ service: 'Sendgrid', auth: { user: process.env.SENDGRID_USERNAME, pass: process.env.SENDGRID_PASSWORD } });
            var mailOptions = {
              from: 'no-reply@demo.net',
              to: user.email,
              subject: 'Account Verification Token',
              text: 'Hello,\n\n' + 'Please verify your account by clicking the link: \nhttp:\/\/' + req.headers.host + '\/confirmation\/' + token.token + '.\n' };
          
            transporter.sendMail(mailOptions, function (err) {
                if (err) { return res.status(500).send({ msg: err.message }); }
                res.status(200).send('A verification email has been sent to ' + user.email + '.');
            });
        });
 
    });
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
            // Make sure the user has been verified
            if (!doc.isVerified) return res.status(401).send({ type: 'not-verified', msg: 'Your account has not been verified.' });
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

    if (
      final_domain == "gmail.com" ||
      final_domain == "hotmail.com" ||
      final_domain.includes("outlook.com") ||
      final_domain.includes("yandex.com") ||
      final_domain.includes("yahoo.com") ||
      final_domain.includes("gmx")
    ) {
      req.flash("error", "E-mail address has not a custom company domain.");
      res.redirect("/supplier/sign-up");
    } else {
      if (req.password < 6) {
        req.flash("error", "Password must have 6 characters at least.");
        res.redirect("/supplier/sign-up");
      } else {
        const supplier = new Supplier({
          companyName: req.body.companyName,
          directorsName: req.body.directorsName,
          contactName: req.body.contactName,
          title: req.body.title,
          companyRegistrationNo: req.body.companyRegistrationNo,
          emailAddress: req.body.emailAddress,
          password: req.body.password,
          isVerified: req.body.isVerified,
          registeredCountry: req.body.registeredCountry,
          companyAddress: req.body.companyAddress,
          areaCovered: req.body.areaCovered,
          contactMobileNumber: req.body.contactMobileNumber,
          country: req.body.country,
          industry: req.body.industry,
          employeeNumbers: req.body.employeeNumbers,
          lastYearTurnover: req.body.lastYearTurnover,
          website: req.body.website,
          productsServicesOffered: req.body.productsServicesOffered,
          capabilityDescription: req.body.capabilityDescription,
          relevantExperience: req.body.relevantExperience,
          supportingInformation: req.body.supportingInformation,
          certificatesUrls: req.body.certificatesUrls,
          antibriberyPolicyUrl: req.body.antibriberyPolicyUrl,
          environmentPolicyUrl: req.body.environmentPolicyUrl,
          qualityManagementPolicyUrl: req.body.qualityManagementPolicyUrl,
          occupationalSafetyAndHealthPolicyUrl: req.body.occupationalSafetyAndHealthPolicyUrl,
          otherRelevantFilesUrls: req.body.otherRelevantFilesUrls,
          balance: req.body.balance,
          UNITETermsAndConditions: true,
          antibriberyAgreement: true
        });

        supplier
          .save(function (err) {
            if (err) { return res.status(500).send({ msg: err.message }); }

            // Create a verification token for this user
            var token = new Token({ _userId: supplier._id, token: crypto.randomBytes(16).toString('hex') });

            // Save the verification token
            token.save(function (err) {
                if (err) { return res.status(500).send({ msg: err.message }); }

                // Send the email
                var transporter = nodemailer.createTransport({ service: 'Sendgrid', auth: { user: process.env.SENDGRID_USERNAME, pass: process.env.SENDGRID_PASSWORD } });
                var mailOptions = {
                  from: 'no-reply@yourwebapplication.com',
                  to: supplier.email, 
                  subject: 'Account Verification Token', 
                  text: 'Hello,\n\n' + 'Please verify your account by clicking the link: \nhttp:\/\/' + req.headers.host + '\/confirmation\/' + token.token + '.\n' };
              
                transporter.sendMail(mailOptions, function (err) {
                    if (err) { return res.status(500).send({ msg: err.message }); }
                    res.status(200).send('A verification email has been sent to ' + supplier.email + '.');
                });
            });
          })
          .then(doc => {
            req.session.supplier = doc;
            req.session.id = doc._id;
            return req.session.save();
          })
          .then(() => {
            req.flash("success", "Supplier signed up successfully!");
            return res.redirect("/supplier");
          })
          .catch(console.error);
      }
    }
  }
};


exports.getProfile = (req, res) => {
  res.render("supplier/profile", { profile: req.session.supplier });
};

exports.getBidRequests = (req, res) => {
  const supplier = req.session.supplier;

  BidRequest.find({ supplier: supplier._id })
    .then(requests => {
      res.render("supplier/bid-requests", {
        supplier: supplier,
        requests: requests
      });
    })
    .catch(console.error);
};


exports.getBalance = (req, res) => {
  res.render("supplier/balance", { balance: req.session.supplier.balance });
}


exports.getBidRequest = (req, res) => {
  const supplier = req.session.supplier;
  let request;
  const id = req.params.id;

  BidRequest.findOne({ _id: id })
    .then(_request => {
      request = _request;
      return Buyer.findOne({ _id: request.buyer });
    })
    .then(buyer => {
      res.render("supplier/bid-request", {
        supplier: supplier,
        request: request,
        buyer: buyer
      });
    })
    .catch(console.error);
};

exports.postBidRequest = (req, res) => {
  if (req.body.message) {
    const newMessage = new Message({
      to: req.body.to,
      from: req.body.from,
      sender: req.body.sender,
      message: req.body.message
    });

    newMessage
      .save()
      .then(result => {
        res.render(req.originalUrl);
      })
      .catch(console.error);
  }
};

exports.postProfile = (req, res) => {
  console.log(req.body);
  Supplier.findOne({ _id: req.body._id }, (err, doc) => {
    if (err) return console.error(err);
    console.log(doc);

    doc.companyName = req.body.companyName;
    doc.directorsName = req.body.directorsName;
    doc.contactName = req.body.contactName;
    doc.title = req.body.title;
    doc.emailAddress = req.body.emailAddress;
    doc.password = req.body.password;
    doc.isVerified = req.body.isVerified;
    doc.companyRegistrationNo = req.body.companyRegistrationNo;
    doc.registeredCountry = req.body.registeredCountry;
    doc.balance = req.body.balance;
    doc.companyAddress = req.body.companyAddress;
    doc.areaCovered = req.body.areaCovered;
    doc.contactMobileNumber = req.body.contactMobileNumber;
    doc.country = req.body.country;
    doc.industry = req.body.industry;
    doc.employeeNumbers = req.body.employeeNumbers;
    doc.lastYearTurnover = req.body.lastYearTurnover;
    doc.website = req.body.website;
    doc.productsServicesOffered = req.body.productsServicesOffered;
    doc.capabilityDescription = req.body.capabilityDescription;
    doc.relevantExperience = req.body.relevantExperience;
    doc.supportingInformation = req.body.supportingInformation;
    doc.certificatesUrls = req.body.certificatesUrls;
    doc.antibriberyPolicyUrl = req.body.antibriberyPolicyUrl;
    doc.environmentPolicyUrl = req.body.environmentPolicyUrl;
    doc.qualityManagementPolicyUrl = req.body.qualityManagementPolicyUrl;
    doc.occupationalSafetyAndHealthPolicyUrl = req.body.occupationalSafetyAndHealthPolicyUrl;
    doc.otherRelevantFilesUrls = req.body.otherRelevantFilesUrls;
    doc.UNITETermsAndConditions = req.body.UNITETermsAndConditions == "on" ? true : false;
    doc.antibriberyAgreement = req.body.antibriberyAgreement == "on" ? true : false;

    return doc.save();
  })
    .then(doc => {
      req.session.supplier = doc;
      req.session.id = doc._id;
      return req.session.save();
    })
    .then(() => {
      req.flash("success", "Supplier details updated successfully!");
      return res.redirect("/supplier");
    })
    .catch(console.error);
};
