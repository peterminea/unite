const express = require("express");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const nodemailer = require('nodemailer');
const Token = require('../models/buyerToken');
const Schema = mongoose.Schema;
const Buyer = require("../models/buyer");
const Supplier = require("../models/supplier");
const BidRequest = require("../models/bidRequest");

exports.getIndex = (req, res) => {
  res.render("buyer/index", {
    buyer: req.session.buyer.organizationName,
    suppliers: null,
    success: req.flash("success")
  });
};

exports.postIndex = (req, res) => {
  if (req.body.capabilityInput) {
    const key = req.body.capabilityInput;

    Supplier.find({}, (err, suppliers) => {
      if (err) return console.error(err);

      const suppliers2 = [];

      for (const supplier of suppliers) {
        if (
          supplier.capabilityDescription
            .toLowerCase()
            .includes(key.toLowerCase())
        ) {
          suppliers2.push(supplier);
        }
      }
      res.render("buyer/index", {
        buyer: req.session.buyer,
        suppliers: suppliers2,
        success: req.flash("success")
      });
    });
  } else if (req.body.itemDescription) {
    console.log(req.body.longItemDescription);
    const bidRequest = new BidRequest({
      itemDescription: req.body.itemDescription,
      productsServicesOffered: req.body.productsServicesOffered,
      itemDescriptionLong: req.body.longItemDescription,
      itemDescriptionUrl: req.urlItemDescription,
      amount: req.body.amount,
      deliveryLocation: req.body.deliveryLocation,
      deliveryRequirements: req.body.deliveryRequirements,
      complianceRequirements: req.body.complianceRequirements,
      complianceRequirementsUrl: req.body.complianceRequirementsUrl,
      otherRequirements: req.body.otherRequirements,
      status: req.body.status,
      price: req.body.price,
      buyer: req.body.buyer,
      supplier: req.body.supplier
    });

    return bidRequest
      .save()
      .then(result => {
        req.flash("success", "Bid requested successfully!");
        return res.redirect("/buyer");
      })
      .catch(console.error);
  } else {
    res.redirect("/buyer");
  }
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
        Buyer.findOne({ _id: token._userId, email: req.body.email }, function (err, user) {
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
 
    Buyer.findOne({ email: req.body.email }, function (err, user) {
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
  if (!req.session.organizationId)
    res.render("buyer/sign-in", {
      errorMessage: req.flash("error")
    });
  else res.redirect("/buyer/");
};

exports.getSignUp = (req, res) => {
  if (!req.session.buyer)
    return res.render("buyer/sign-up", {
      errorMessage: req.flash("error")
    });
  else res.redirect("/buyer");
};


exports.getBalance = (req, res) => {
  res.render("buyer/balance", { balance: req.session.buyer.balance });
}


exports.postSignIn = (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  if (!email) res.redirect("buyer/sign-in");
  else {
    Buyer.findOne({ emailAddress: email }, (err, doc) => {
      if (err) return console.error(err);

      if (!doc) {
        req.flash("error", "Invalid e-mail address or password");
        return res.redirect("/buyer/sign-in");
      }

      bcrypt
        .compare(password, doc.password)
        .then(doMatch => {
          if (doMatch) {
            req.session.organizationId = doc._id;
            req.session.buyer = doc;
            // Make sure the user has been verified
            if (!doc.isVerified) return res.status(401).send({ type: 'not-verified', msg: 'Your account has not been verified.' });
            
            return req.session.save();
          } else {
            req.flash("error", "Invalid e-mail address or password");
            res.redirect("/buyer/sign-in");
          }
        })
        .then(err => {
          if (err) return console.error(err);
          res.redirect("/buyer/");
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
      res.redirect("/buyer/sign-up");
    } else {
      if (req.password < 6) {
        req.flash("error", "Password must have 6 characters at least.");
        res.redirect("/buyer/sign-up");
      } else {
        console.log(new Schema.Types.ObjectId(req.body.organizationUniteID));
        const buyer = new Buyer({
          organizationName: req.body.organizationName,
          organizationUniteID: req.body.organizationUniteID,
          contactName: req.body.contactName,
          emailAddress: req.body.emailAddress,
          password: req.body.password,          
          isVerified: req.body.isVerified,
          address: req.body.address,
          balance: req.body.balance,
          deptAgencyGroup: req.body.deptAgencyGroup,
          qualification: req.body.qualification,
          country: req.body.country
        });
        
        buyer
          .save(function (err) {
            if (err) { return res.status(500).send({ msg: err.message }); }

            // Create a verification token for this user
            var token = new Token({ _userId: buyer._id, token: crypto.randomBytes(16).toString('hex') });

            // Save the verification token
            token.save(function (err) {
                if (err) { return res.status(500).send({ msg: err.message }); }

                // Send the email
                var transporter = nodemailer.createTransport({ service: 'Sendgrid', auth: { user: process.env.SENDGRID_USERNAME, pass: process.env.SENDGRID_PASSWORD } });
              
                var mailOptions = {
                  from: 'no-reply@yourwebapplication.com',
                  to: buyer.email, 
                  subject: 'Account Verification Token', 
                  text: 'Hello,\n\n' + 'Please verify your account by clicking the link: \nhttp:\/\/' + req.headers.host + '\/confirmation\/' + token.token + '.\n' };
    
                transporter.sendMail(mailOptions, function (err) {
                    if (err) { return res.status(500).send({ msg: err.message }); }
                    res.status(200).send('A verification email has been sent to ' + buyer.email + '.');
                });
            });
          })
          .then(doc => {
            req.session.buyer = doc;
            req.session.id = doc._id;
            return req.session.save();
          })
          .then(() => {
            req.flash("success", "Buyer signed up successfully!");
            return res.redirect("/buyer");
          })
          .catch(console.error);
      }
    }
  }
};

exports.getProfile = (req, res) => {
  res.render("buyer/profile", { profile: req.session.buyer });
};

exports.postProfile = (req, res) => {
  Buyer.findOne({ _id: req.body._id }, (err, doc) => {
    if (err) return console.error(err);
    //if(!doc) doc = new Buyer();
    doc.organizationName = req.body.organizationName;
    doc.organizationUniteID = req.body.organizationUniteID;
    doc.contactName = req.body.contactName;
    doc.emailAddress = req.body.emailAddress;
    doc.password = req.body.password;
    doc.isVerified = req.body.isVerified;
    doc.address = req.body.address;
    doc.balance = req.body.balance;
    doc.deptAgencyGroup = req.body.deptAgencyGroup;
    doc.qualification = req.body.qualification;
    doc.country = req.body.country;

    return doc.save();
  })
    .then(doc => {
      req.session.buyer = doc;
      req.session.id = doc._id;
      return req.session.save();
    })
    .then(() => {
      req.flash("success", "Buyer details updated successfully!");
      return res.redirect("/buyer");
    })
    .catch(console.error);
};
