const bcrypt = require("bcryptjs");
const Supervisor = require("../models/supervisor");
const Buyer = require("../models/buyer");
const nodemailer = require('nodemailer');
const Token = require('../models/supervisorToken');

exports.getIndex = (req, res) => {
  const supervisor = req.session.supervisor;

  Supervisor.find(
    { organizationUniteID: supervisor.organizationUniteID },
    (err, results) => {
      if (err) return console.error(err);
      console.log(results);
      res.render("supervisor/index", {
        supervisor: supervisor,
        buyers: results,
        success: req.flash("success")
      });
    }
  );
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
        Supervisor.findOne({ _id: token._userId, email: req.body.email }, function (err, user) {
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
 
    Supervisor.findOne({ email: req.body.email }, function (err, user) {
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
  if (!req.session.supervisorId)
    res.render("supervisor/sign-in", {
      errorMessage: req.flash("error")
    });
  else res.redirect("/supervisor/");
};

exports.getSignUp = (req, res) => {
  if (!req.session.supervisor)
    return res.render("supervisor/sign-up", {
      errorMessage: req.flash("error")
    });
  else res.redirect("/supervisor");
};

exports.postSignIn = (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  if (!email) res.redirect("supervisor/sign-in");
  else {
    Supervisor.findOne({ emailAddress: email }, (err, doc) => {
      if (err) return console.error(err);

      if (!doc) {
        req.flash("error", "Invalid e-mail address or password");
        return res.redirect("/supervisor/sign-in");
      }

      bcrypt
        .compare(password, doc.password)
        .then(doMatch => {
          if (doMatch) {
            req.session.supervisorId = doc._id;
            req.session.supervisor = doc;
            // Make sure the user has been verified
            if (!doc.isVerified) return res.status(401).send({ type: 'not-verified', msg: 'Your account has not been verified.' });
            return req.session.save();
          } else {
            req.flash("error", "Invalid e-mail address or password");
            res.redirect("/supervisor/sign-in");
          }
        })
        .then(err => {
          if (err) return console.error(err);
          res.redirect("/supervisor/");
        })
        .catch(console.error);
    });
  }
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
      res.redirect("/supervisor/sign-up");
    } else {
      if (req.password < 6) {
        req.flash("error", "Password must have 6 characters at least.");
        res.redirect("/supervisor/sign-up");
      } else {
        const supervisor = new Supervisor({
          organizationName: req.body.organizationName,
          organizationUniteID: req.body.organizationUniteID,
          contactName: req.body.contactName,
          emailAddress: req.body.emailAddress,
          password: req.body.password,
          isVerified: req.body.isVerified,
          address: req.body.address,
          country: req.body.country,
          certificatesUrls: req.body.certificatesUrls,
          antibriberyPolicyUrl: req.body.antibriberyPolicyUrl,
          environmentPolicyUrl: req.body.environmentPolicyUrl,
          qualityManagementPolicyUrl: req.body.qualityManagementPolicyUrl,
          occupationalSafetyAndHealthPolicyUrl: req.body.occupationalSafetyAndHealthPolicyUrl,
          otherRelevantFilesUrls: req.body.otherRelevantFilesUrls,
          UNITETermsAndConditions: true,
          antibriberyAgreement: true
        });

        supervisor
          .save(function (err) {
            if (err) { return res.status(500).send({ msg: err.message }); }

            // Create a verification token for this user
            var token = new Token({ _userId: supervisor._id, token: crypto.randomBytes(16).toString('hex') });

            // Save the verification token
            token.save(function (err) {
                if (err) { return res.status(500).send({ msg: err.message }); }

                // Send the email
                var transporter = nodemailer.createTransport({ service: 'Sendgrid', auth: { user: process.env.SENDGRID_USERNAME, pass: process.env.SENDGRID_PASSWORD } });
              
                var mailOptions = {
                  from: 'no-reply@yourwebapplication.com',
                  to: supervisor.email, 
                  subject: 'Account Verification Token', 
                  text: 'Hello,\n\n' + 'Please verify your account by clicking the link: \nhttp:\/\/' + req.headers.host + '\/confirmation\/' + token.token + '.\n' };
              
                transporter.sendMail(mailOptions, function (err) {
                    if (err) { return res.status(500).send({ msg: err.message }); }
                    res.status(200).send('A verification email has been sent to ' + supervisor.email + '.');
                });
            });
          })
          .then(doc => {
            req.session.supervisor = doc;
            req.session.id = doc._id;
            return req.session.save();
          })
          .then(() => {
            req.flash("success", "Supervisor signed up successfully!");
            return res.redirect("/supervisor");
          })
          .catch(console.error);
      }
    }
  }
};


exports.getProfile = (req, res) => {
  res.render("supervisor/profile", { profile: req.session.supervisor });
};

exports.postProfile = (req, res) => {
  Supervisor.findOne({ _id: req.body._id }, (err, doc) => {
    if (err) return console.error(err);
    
    doc.organizationName = req.body.organizationName;
    doc.organizationUniteID = req.body.organizationUniteID;
    doc.contactName = req.body.contactName;
    doc.emailAddress = req.body.emailAddress;
    doc.password = req.body.password;
    doc.isVerified = req.body.isVerified;
    doc.address = req.body.address;
    doc.country = req.body.country;
    doc.certificatesUrls = req.body.certificatesUrls;
    doc.antibriberyPolicyUrl = req.body.antibriberyPolicyUrl;
    doc.environmentPolicyUrl = req.body.environmentPolicyUrl;
    doc.qualityManagementPolicyUrl = req.body.qualityManagementPolicyUrl;
    doc.occupationalSafetyAndHealthPolicyUrl = req.body.occupationalSafetyAndHealthPolicyUrl;
    doc.otherRelevantFilesUrls = req.body.otherRelevantFilesUrls;
    doc.UNITETermsAndConditions = req.body.UNITETermsAndConditions == 'on'? true : false;
    doc.antibriberyAgreement = req.body.antibriberyAgreement == 'on'? true : false;

    return doc.save();
  })
    .then(doc => {
      req.session.supervisor = doc;
      req.session.id = doc._id;
      return req.session.save();
    })
    .then(() => {
      req.flash("success", "Supervisor details updated successfully!");
      return res.redirect("/supervisor");
    })
    .catch(console.error);
};