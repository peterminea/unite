const express = require("express");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const nodemailer = require('nodemailer');
const sgTransport = require('nodemailer-sendgrid-transport')
const Token = require('../models/supplierToken');
const assert = require('assert');
const crypto = require('crypto');
const process = require('process');
const Schema = mongoose.Schema;
const Buyer = require("../models/buyer");
const Supplier = require("../models/supplier");
const BidRequest = require("../models/bidRequest");
const async = require('async');

exports.getIndex = (req, res) => {
  res.render("buyer/index", {
    buyer: req.session.buyer,
    suppliers: null,
    success: req.flash("success")
  });
};

exports.postIndex = (req, res) => {
  console.log(req.body.buyer);
  console.log(req.body.supplier);
  if (req.body.capabilityInput) {
    const key = req.body.capabilityInput;

    Supplier.find({}, (err, suppliers) => {
      if (err) return console.error(err);

      const suppliers2 = [];
      console.log(key);
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
    //console.log(req.body.itemDescription);
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
      createdAt: req.body.createdAt? req.body.createdAt : Date.now(),
      updatedAt: Date.now(),
      buyer: req.body.buyer,
      supplier: req.body.supplier
    });
    
  console.log(bidRequest);
    
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

/*
exports.getLogout = (req, res, next) => {
  if (req.session) {    
    req.session.destroy(function(err) {
      if(err) {
        return next(err);
      } else {
        return res.redirect('/');
      }
    });
  }
}*/


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
        if (!token) return res.status(400).send({ 
          type: 'not-verified', 
          msg: 'We were unable to find a valid token. Your token may have expired.' });
 
        // If we found a token, find a matching user
        Buyer.findOne({ _id: token._userId, email: req.body.email }, function (err, user) {
            if (!user) return res.status(400).send({ msg: 'We were unable to find a user for this token.' });
            if (user.isVerified) return res.status(400).send({ 
              type: 'already-verified', 
              msg: 'This user has already been verified.' });
 
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
 
    Buyer.findOne({ emailAddress: req.body.emailAddress }, function (err, user) {
        if (!user) 
          return res.status(400).send({ msg: 'We were unable to find a user with that email.' });
        if (user.isVerified) 
          return res.status(400).send({ msg: 'This account has already been verified. Please log in.' });
 
        // Create a verification token, save it, and send email
        var token = new Token({ 
          _userId: user._id, 
          token: crypto.randomBytes(16).toString('hex') });
 
        // Save the token
        token.save(function (err) {
            if (err) { return res.status(500).send({ msg: err.message }); }
 
            // Send the email
            var options = {
              auth: {
                api_user: 'SENDGRID_USERNAME',
                api_key: 'SENDGRID_PASSWORD'
              }
            }

            var transporter = nodemailer.createTransport(sgTransport(options));
            var mailOptions = {
              from: 'no-reply@uniteprocurement.com',
              to: user.emailAddress,
              subject: 'Account Verification Token',
              text: 'Hello,\n\n' + 'Please verify your account by clicking the link: \nhttp:\/\/' + req.headers.host + '\/confirmation\/' + token.token + '.\n' 
            };
          
              transporter.sendMail(mailOptions, function (err, info) {
                 if (err ) {
                  console.log(err);
                }  else {
                  console.log('Message sent: ' + info.response);
                }
                  //if (err) { return res.status(500).send({ msg: err.message }); }
                  //return res.status(200).send('A verification email has been sent to ' + supplier.emailAddress + '.');
                });
        });
  });
}

exports.getSignIn = (req, res) => {
  if (!req.session.organizationId)
    res.render("buyer/sign-in", {
      errorMessage: req.flash("error")
    });
  else res.redirect("/buyer");
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
/*
exports.getSupplier = (req, res) => {
  res.render("buyer/supplier", { balance: req.session.buyer.balance });
}*/

exports.getForgotPassword = (req, res) => {
  res.render("buyer/forgotPassword", {
    email: req.session.buyer.emailAddress
  });
}

exports.postForgotPassword = (req, res, next) => {
  async.waterfall([
    function(done) {
      crypto.randomBytes(20, function(err, buf) {
        var token = buf.toString('hex');
        done(err, token);
      });
    },
    function(token, done) {
      Buyer.findOne({ emailAddress: req.body.emailAddress }, function (err, user) {
        if (!user) {
          req.flash('error', 'Sorry. We were unable to find a user with this e-mail address.');
          return res.redirect('buyer/forgotPassword');
        }
        
        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 43200000;//12 hours
        user.save(function(err) {
          done(err, token, user);
        });
      });      
    },
    function(token, user, done) {
      var options = {
        auth: {
          api_user: 'SENDGRID_USERNAME',
          api_key: 'SENDGRID_PASSWORD'
        }
      }

      var transporter = nodemailer.createTransport(sgTransport(options));

      var emailOptions = {
        from: 'no-reply@uniteprocurement.com',
        to: user.emailAddress, 
        subject: 'UNITE Password Reset - Buyer', 
        text: 'Hello,\n\n' 
        + 'You have received this e-mail because you requested a Buyer password reset on our UNITE platform.'
        + 'Please verify your account by clicking the link: \nhttp:\/\/' 
        + req.headers.host + '\/reset\/' + token + '.\n'
        //, html: '<b>Hello world</b>'
      };
      
      transporter.sendMail(emailOptions, function(err) {
        console.log('E-mail sent!')
        req.flash('success', 'An e-mail has been sent to ' + user.emailAddress + ' with password reset instructions.');
        done(err, 'done');
      });      
    }
  ], function(err) {
    if(err)
      return next(err);
      res.redirect('/buyer/forgotPassword');
  });
}


exports.getResetPasswordToken = (req, res) => {
  Buyer.findOne({resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() }}, function(err, user) {
    if(!user) {
      req.flash('error', 'Password reset token is either invalid or expired.');
      return res.redirect('/forgotPassword');
    }
    res.render('/resetPassword', {token: req.params.token});
  });
}


exports.postResetPasswordToken = (req, res) => {
  async.waterfall([
    function(done) {
      Buyer.findOne({resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() }}, function(err, user) {
      if(!user) {
        req.flash('error', 'Password reset token is either invalid or expired.');
        return res.redirect('back');
      }
        
    if(req.body.password === req.body.confirm) {
      user.setPassword(req.body.password, function(err) {
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        
        user.save(function(err) {
          req.logIn(user, function(err) {
            done(err, user);
          });
        });
      })
      } else {
        req.flash('error', 'Passwords do not match.');
        return res.redirect('back');
      }
    });
    },
    function(user, done) {
      var options = {
        auth: {
          api_user: 'SENDGRID_USERNAME',
          api_key: 'SENDGRID_PASSWORD'
        }
      }

      var transporter = nodemailer.createTransport(sgTransport(options));

      var emailOptions = {
        from: 'no-reply@uniteprocurement.com',
        to: user.emailAddress, 
        subject: 'UNITE Password changed - Buyer', 
        text: 'Hello,\n\n' 
        + 'You have successfully reset your Buyer password on our UNITE platform'
        + 'for your account ' + user.emailAddress + '. You can log in again.'        
      };
      
      transporter.sendMail(emailOptions, function(err) {
        console.log('E-mail sent!')
        req.flash('success', 'Your password has been successfully changed!');
        done(err, 'done');
      });      
    }
  ], function(err) {
      res.redirect('/buyer');
    });
}


exports.postSignIn = (req, res) => {
  const email = req.body.emailAddress;
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
          if (doMatch || (password === doc.password && email === doc.emailAddress)) {
            req.session.organizationId = doc._id;
            req.session.buyer = doc;
            // Make sure the user has been verified
            if (!doc.isVerified) 
              return res.status(401).send({
                type: 'not-verified', 
                msg: 'Your account has not been verified. Please check your e-mail for instructions.' });
            
            req.session.cookie.originalMaxAge = 1==1 || req.body.remember? null : 7200000;
            console.log(req.session.cookie);  
            return req.session.save();
          } else {
            req.flash("error", "Invalid e-mail address or password");
            res.redirect("/buyer/sign-in");
          }
        })
        .then(err => {
          if (err) return console.error(err);
          res.redirect("/buyer");
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
    var prohibitedArray = ["gmail.com", "hotmail.com", "outlook.com", "yandex.com", "yahoo.com", "gmx"];
    
    for(var i = 0; i < prohibitedArray.length; i++)
    if(final_domain.includes(prohibitedArray[i])) {
      req.flash("error", "E-mail address must be a custom company domain.");
      //res.redirect("/buyer/sign-up");
    } else {
      if (req.body.password.length < 6) {
        req.flash("error", "Password must have at least 6 characters.");
        res.redirect("back");
      } else {
        const buyer = new Buyer({
          organizationName: req.body.organizationName,
          organizationUniteID: req.body.organizationUniteID,
          contactName: req.body.contactName,
          emailAddress: req.body.emailAddress,
          password: req.body.password,          
          isVerified: false,
          address: req.body.address,
          balance: req.body.balance,
          deptAgencyGroup: req.body.deptAgencyGroup,
          qualification: req.body.qualification,
          country: req.body.country,
          createdAt: Date.now(),
          updatedAt: Date.now()
        });
  
      var user = new Promise((resolve, reject) => {
        buyer.save((err) => {
          if (err) {
            return reject(new Error('Error with exam result save... ${err}'));
          }
          
            var token = new Token({
              _userId: buyer._id, 
              token: crypto.randomBytes(16).toString('hex') });

            token.save(function (err) {
              if (err) { return res.status(500).send({ msg: err.message }); }

              var options = {
                auth: {
                  api_user: 'SENDGRID_USERNAME',
                  api_key: 'SENDGRID_PASSWORD'
                }
              }

              var transporter = nodemailer.createTransport(sgTransport(options));
           
              var email = {
                from: 'no-reply@uniteprocurement.com',
                to: buyer.emailAddress, 
                subject: 'Account Verification Token', 
                text: 'Hello,\n\n' + 'Please verify your account by clicking the link: \nhttp:\/\/' + req.headers.host + '\/confirmation\/' + token.token + '.\n'
                //, html: '<b>Hello world</b>'
              };
          
              transporter.sendMail(email, function (err, info) {
                 if (err ) {
                  console.log(err);
                }  else {
                  console.log('Message sent: ' + info.response);
                }
                  //if (err) { return res.status(500).send({ msg: err.message }); }
                  //return res.status(200).send('A verification email has been sent to ' + buyer.emailAddress + '.');
                });
              });
            });
         
          return resolve(buyer);
        });
      
        assert.ok(user instanceof Promise);
        
        user
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
    doc.createdAt = req.body.createdAt;
    doc.updatedAt = Date.now();

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