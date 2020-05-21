const bcrypt = require("bcryptjs");
const Supplier = require("../models/supplier");
const Buyer = require("../models/buyer");
const BidRequest = require("../models/bidRequest");
const ProductService = require("../models/productService");
const Message = require("../models/message");
const nodemailer = require('nodemailer');
const sgTransport = require('nodemailer-sendgrid-transport')
const Token = require('../models/supplierToken');
const assert = require('assert');
const crypto = require('crypto');
const process = require('process');
const async = require('async');

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

exports.getAddProduct = (req, res) => {
  res.render("supplier/addProduct", {
    supplierId: req.session.supplier._id
  });
};

exports.postAddProduct = (req, res) => {
  if(!req.body.productPrice) {
    console.error('Price is not valid, please correct it.');
    res.redirect('back');
  } else {
    const product = new ProductService({
      supplier: req.body._id,
      productName: req.body.productName,
      productPrice: req.body.productPrice,
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
    
    product
      .save()
      .then(() => {
            req.flash("success", "Product added successfully!");
            return res.redirect("/supplier/profile");
          })
          .catch(console.error);
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
        if (!token) 
          return res.status(400).send({
            type: 'not-verified', 
            msg: 'We were unable to find a valid token. Your token may have expired.' });
 
        // If we found a token, find a matching user
        Supplier.findOne({
          _id: token._userId, 
          email: req.body.emailAddress }, function (err, user) {
            if (!user) 
              return res.status(400).send({ msg: 'We were unable to find a user for this token.' });
            if (user.isVerified) 
              return res.status(400).send({ 
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
 
    Supplier.findOne({ emailAddress: req.body.emailAddress }, function (err, user) {
        if (!user) return res.status(400).send({ msg: 'We were unable to find a user with that email.' });
        if (user.isVerified) return res.status(400).send({ msg: 'This account has already been verified. Please log in.' });
 
        // Create a verification token, save it, and send email
        var token = new Token({
          _userId: user._id, 
          token: crypto.randomBytes(16).toString('hex') });
 
        // Save the token
        token.save(function (err) {
            if (err) { return res.status(500).send({ msg: err.message }); }
              var options = {
                auth: {
                  api_user: 'SENDGRID_USERNAME',
                  api_key: 'SENDGRID_PASSWORD'
                }
              }

            var transporter = nodemailer.createTransport(sgTransport(options)); 
            // Send the email
            //var transporter2 = nodemailer.createTransport({ service: 'Sendgrid', auth: { user: process.env.SENDGRID_USERNAME, pass: process.env.SENDGRID_PASSWORD } });
            var mailOptions = {
              from: 'no-reply@uniteprocurement.com',
              to: user.emailAddress,
              subject: 'Account Verification Token',
              text: 'Hello,\n\n' + 'Please verify your account by clicking the link: \nhttp:\/\/' + req.headers.host + '\/confirmation\/' + token.token + '.\n' };
          
            transporter.sendMail(mailOptions, function (err, info) {
                if (err) { return res.status(500).send({ msg: err.message }); }
                res.status(200).send('A verification email has been sent to ' + user.emailAddress + '.');
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
  const email = req.body.emailAddress;
  const password = req.body.password;
  console.log(email + ' ' + password);

  if(!email) res.redirect("/supplier/sign-in");
  else {
    Supplier.findOne({ emailAddress: email }, (err, doc) => {
      if (err) 
        return console.error(err);
  
      if (!doc) {
        req.flash("error", "Invalid e-mail address or password");
        return res.redirect("/supplier/sign-in");
      }

      bcrypt
        .compare(password, doc.password)
        .then(doMatch => {
          if (doMatch || (password === doc.password && email === doc.emailAddress)) {
            req.session.supplier = doc;
            req.session.id = doc._id;
            
            // Make sure the user has been verified
            if (!doc.isVerified) 
              return res.status(401).send({ 
              type: 'not-verified', 
              msg: 'Your account has not been verified. Please check your e-mail for instructions.' });
            
            req.session.cookie.originalMaxAge = 1==1 || req.body.remember? null : 7200000;
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
    var prohibitedArray = ["gmail.com", "hotmail.com", "outlook.com", "yandex.com", "yahoo.com", "gmx"];
    
    for(var i = 0; i < prohibitedArray.length; i++)
    if(final_domain.includes(prohibitedArray[i])) {
      req.flash("error", "E-mail address must be a custom company domain.");
      //res.redirect("/supplier/sign-up");
    } else {
      if (req.body.password.length < 6) {
        req.flash("error", "Password must have at least 6 characters.");
        res.redirect("back");
      } else {
        const supplier = new Supplier({
          companyName: req.body.companyName,
          directorsName: req.body.directorsName,
          contactName: req.body.contactName,
          title: req.body.title,
          companyRegistrationNo: req.body.companyRegistrationNo,
          emailAddress: req.body.emailAddress,
          password: req.body.password,
          isVerified: false,
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
          antibriberyAgreement: true,
          createdAt: Date.now(),
          updatedAt: Date.now()
        });

      var user = new Promise((resolve, reject) => {
        // Save model
        supplier.save((err) => {
          if (err) {
            return reject(new Error('Error with exam result save... ${err}'));
          }
          
            // Create a verification token for this user
            var token = new Token({ 
              _userId: supplier._id, 
              token: crypto.randomBytes(16).toString('hex') });

            // Save the verification token
            token.save(function (err) {
              if (err) { 
                return res.status(500).send({ msg: err.message });
              }

              var options = {
                auth: {
                  api_user: 'SENDGRID_USERNAME',
                  api_key: 'SENDGRID_PASSWORD'
                }
              }

              var transporter = nodemailer.createTransport(sgTransport(options));
              /*
              // Send the email
              var transporter2 = nodemailer.createTransport({
                service: 'Sendgrid', 
                auth: {
                  user: process.env.SENDGRID_USERNAME,
                  pass: process.env.SENDGRID_PASSWORD 
                } 
              });*/
              
              var email = {
                from: 'no-reply@uniteprocurement.com',
                to: supplier.emailAddress, 
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
                  //return res.status(200).send('A verification email has been sent to ' + supplier.emailAddress + '.');
                });
              });
            });
          
          // Return saved model
          return resolve(supplier);
        });
      
        assert.ok(user instanceof Promise);
        
        user
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


exports.getForgotPassword = (req, res) => {
  res.render("supplier/forgotPassword", {
    email: req.session.supplier.emailAddress
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
      Supplier.findOne({ emailAddress: req.body.emailAddress }, function (err, user) {
        if (!user) {
          req.flash('error', 'Sorry. We were unable to find a user with this e-mail address.');
          return res.redirect('supplier/forgotPassword');
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
        subject: 'UNITE Password Reset - Supplier', 
        text: 'Hello,\n\n' 
        + 'You have received this e-mail because you requested a Supplier password reset on our UNITE platform.'
        + 'Please verify your account by clicking the link: \nhttp:\/\/' 
        + req.headers.host + '\/reset\/' + token + '.\n'
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
      res.redirect('supplier/forgotPassword');
  });
}


exports.getResetPasswordToken = (req, res) => {
  Supplier.findOne({resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() }}, function(err, user) {
    if(!user) {
      req.flash('error', 'Password reset token is either invalid or expired.');
      return res.redirect('supplier/forgotPassword');
    }
    res.render('supplier/resetPassword', {token: req.params.token});
  });
}


exports.postResetPasswordToken = (req, res) => {
  async.waterfall([
    function(done) {
      Supplier.findOne({resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() }}, function(err, user) {
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
        subject: 'UNITE Password changed - Supplier', 
        text: 'Hello,\n\n' 
        + 'You have successfully reset your Supplier password on our UNITE platform'
        + 'for your account ' + user.emailAddress + '. You can log in again.'        
      };
      
      transporter.sendMail(emailOptions, function(err) {
        console.log('E-mail sent!')
        req.flash('success', 'Your password has been successfully changed!');
        done(err, 'done');
      });      
    }
  ], function(err) {
      res.redirect('/supplier');
    });
}



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
      return Buyer.findOne({ _id: request.buyer });//Object ID
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
    doc.createdAt = req.body.createdAt;
    doc.updatedAt = Date.now();

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