const crypto = require('crypto');
const express = require("express");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const Token = require('../models/buyerToken');
const assert = require('assert');
const process = require('process');
const Schema = mongoose.Schema;
const Message = require("../models/message");
const Buyer = require("../models/buyer");
const Supervisor = require("../models/supervisor");
const Supplier = require("../models/supplier");
const BidRequest = require("../models/bidRequest");
const BidStatus = require("../models/bidStatus");
const async = require('async');
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
const MongoClient = require('mongodb').MongoClient;
const ObjectId = require("mongodb").ObjectId;
const URL = process.env.MONGODB_URI, BASE = process.env.BASE;

const statusesJson = {
  BUYER_REQUESTED_BID: parseInt(process.env.BUYER_REQ_BID),
  WAIT_BUYER_PROCESS_INFO: parseInt(process.env.BUYER_PROC_INFO),
  BUYER_WANTS_FOR_PRICE: parseInt(process.env.BUYER_ACCEPT_PRICE),
  SUPP_STARTED_DELIVERY: parseInt(process.env.SUPP_START_DELIVERY),
  PAYMENT_DELIVERY_DONE: parseInt(process.env.PAYMENT_DELIVERY_DONE),
  SUPPLIER_CANCELS_BID: parseInt(process.env.SUPP_CANCEL_BID),
  BUYER_CANCELS_BID: parseInt(process.env.BUYER_CANCEL_BID)
};

exports.getIndex = (req, res) => {
  res.render("buyer/index", {
    buyer: req.session.buyer,
    suppliers: null,
    success: req.flash("success")
  });
}

exports.postIndex = (req, res) => {
  if (req.body.capabilityInput) {//req.term for Autocomplete
    const key = req.body.capabilityInput;

    Supplier.find({}, (err, suppliers) => {
      if (err) 
        return console.error(err);

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
      
    var promise = BidStatus.find({}).exec();
    promise.then((statuses) => {//console.log(JSON.stringify(statusesJson)); console.log(statuses);
        res.render("buyer/index", {
          buyer: req.session.buyer,
          suppliers: suppliers2,
          MAX_PROD: process.env.BID_MAX_PROD,
          statuses: statuses,
          statusesJson: JSON.stringify(statusesJson),
          success: req.flash("success")
        });
      });
    });
  } else if (req.body.itemDescription) {//New Bid Request
    var productList = (req.body.productsServicesOffered);
    var amountList = (req.body.amountList);
    var priceList = (req.body.priceList);
    
    productList = productList.split(',');
    amountList = amountList.split(',');
    priceList = priceList.split(',');
    
    var products = [];
    
    for(var i in productList) {
      products.push('Product name: \'' + productList[i] + '\', amount: ' + parseInt(amountList[i]) + ', price: ' + parseFloat(priceList[i]) + '.');
    }
    
    const bidRequest = new BidRequest({
      requestName: req.body.requestName,
      supplierName: req.body.supplierName,
      buyerName: req.body.buyerName,
      buyerEmail: req.body.buyerEmail,
      supplierEmail: req.body.supplierEmail,
      itemDescription: req.body.itemDescription,
      productsServicesOffered: req.body.productsServicesOffered,
      amountList: req.body.amountList,
      priceList: req.body.priceList,
      orderedProducts: products,
      itemDescriptionLong: req.body.itemDescriptionLong,
      itemDescriptionUrl: req.itemDescriptionUrl,
      amount: req.body.amount,
      deliveryLocation: req.body.deliveryLocation,
      deliveryRequirements: req.body.deliveryRequirements,
      complianceRequirements: req.body.complianceRequirements,
      complianceRequirementsUrl: req.body.complianceRequirementsUrl,
      otherRequirements: req.body.otherRequirements,
      status: req.body.status,
      price: req.body.price,
      isCancelled: false,
      currency: req.body.currency,
      createdAt: req.body.createdAt? req.body.createdAt : Date.now(),
      updatedAt: Date.now(),
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
}


exports.getViewBids = (req, res) => {
  var promise = BidRequest.find({supplier: req.params.supplierId, buyer: req.params.buyerId}).exec();
  
  promise.then((bids) => {
    res.render("buyer/viewBid", {
      bids: bids? bids : [],
      stripePublicKey: process.env.STRIPE_KEY_PUBLIC,
      stripeSecretKey: process.env.STRIPE_KEY_SECRET,
      statusesJson: JSON.stringify(statusesJson),
      supplierId: req.params.supplierId, 
      buyerId: req.params.buyerId
    });
  });
}


exports.postViewBids = (req, res) => {
  MongoClient.connect(URL, function(err, db) {//db or client.
      if (err) throw err;
      var dbo = db.db(BASE);
      var myquery = { _id: req.body.id };
      var newvalues = { $set: {status: req.body.status} };
      dbo.collection("bidrequests").updateOne(myquery, newvalues, function(err, res) {        
        if(err) {
          console.error(err.message);
          return false;
        }
        req.flash('success', 'Bid status updated successfully!');        
        
      if(req.body.message) {
        const newMessage = new Message({
          to: req.body.to,
          from: req.body.from,
          sender: req.body.sender,
          receiver: req.body.receiver,
          bidRequestId: req.body.reqId,
          message: req.body.message
        });

        newMessage
          .save()
          .then( (err, result) => {
            if(err) {
              console.error(err.message);        
            }

            req.flash('', 'Message sent to Supplier!');
        })
          .catch(console.error);              
      }
        
        db.close();
      });
    
    res.redirect('back');
    });  
}


exports.postCancelBid = (req, res) => {
  //BidRequest.findOne({_id: req.body.bidId});
  MongoClient.connect(URL, {useUnifiedTopology: true}, function(err, db) {
      if (err) 
        throw err;
      var dbo = db.db(BASE);
      var myquery = { _id: new ObjectId(req.body.bidId) };
      var newvalues = { $set: {isCancelled: true, status: parseInt(process.env.BUYER_BID_CANCEL)} };
    
      dbo.collection("bidrequests").updateOne(myquery, newvalues, function(err, resp) {
        if(err) {
          console.error(err.message);
          return res.status(500).send({ 
            msg: err.message 
          });
        }
        
        db.close();
        var mailOptions = {
          from: "peter@uniteprocurement.com",
          to: req.body.suppliersEmail,
          subject: "Bid request " + req.body.requestsName + " cancelled!",
          text:
            "Hello " + req.body.suppliersName + 
            ",\n\nWe regret to inform you that your incoming Order named " + req.body.requestsName + " has been cancelled by "
            + "the Buyer " + req.body.buyersName + ".\nPlease contact the Buyer at " + req.body.buyersEmail + " for more"
            + " details.\nUNITE apologizes for any inconvenience that this issue may have caused to you."+ "\n\n"
            + "Sincerely,\nThe UNITE Public Procurement Platform Staff"
        };

        sgMail.send(mailOptions, function(err) {
          if(err) {
            return res.status(500).send({ msg: err.message });
          }
          
          var msg = "The Bid Request has been cancelled by Buyer " + req.body.buyersName + '.\n' + 'Supplier ' + req.body.suppliersName + ' has been notified via e-mail about the Order cancellation.';
          console.log(msg);
          req.flash('success', msg);
          //res.status(200).send(msg);
          res.redirect('back');
      });
    });
  });
}

exports.getConfirmation = (req, res) => {
  res.render('buyer/confirmation', {token: req.params.token});
}


exports.getResendToken = (req, res) => {
  res.render('buyer/resend');
}


exports.postConfirmation = function (req, res, next) {
    Token.findOne({ token: req.params.token }, function (err, token) {
        if (!token) {
          req.flash('We were unable to find a valid token. It may have expired. Please request a new token.');
          res.redirect('/buyer/resend');
          if(1==2) 
            return res.status(400).send({
            type: 'not-verified', 
            msg: 'We were unable to find a valid token. Your token may have expired.' });
        }

        Buyer.findOne({ _id: token._userId, emailAddress: req.body.emailAddress }, function (err, user) {
            if (!user) 
              return res.status(400).send({
              msg: 'We were unable to find a user for this token.' 
            });
          
            if (user.isVerified) 
              return res.status(400).send({ 
              type: 'already-verified', 
              msg: 'This user has already been verified.' });           
          
              MongoClient.connect(URL, function(err, db) {
                    if (err) throw err;
                    var dbo = db.db(BASE);
                    var myquery = { _id: user._id };
                    var newvalues = { $set: {isVerified: true} };
                    dbo.collection("buyers").updateOne(myquery, newvalues, function(err, resp) {
                      if(err) {
                        console.error(err.message);
                        /*
                        return res.status(500).send({ 
                          msg: err.message 
                        });
                        */
                        return false;
                      }                   

                      console.log("The account has been verified. Please log in.");
                      req.flash('success', "The account has been verified. Please log in.");
                      db.close();
                      if(res) res.status(200).send("The account has been verified. Please log in.");
                    });
                  });
          /*
            user.isVerified = true;
            user.save(function (err) {
              if (err) {                
              }              
            });*/
        });
    });
}


exports.postResendToken = function (req, res, next) {/*
    req.assert('emailAddress', 'Email is not valid').isEmail();
    req.assert('emailAddress', 'Email cannot be blank').notEmpty();
    req.sanitize('emailAddress').normalizeEmail({ remove_dots: false });   
    var errors = req.validationErrors();
    if (errors) return res.status(400).send(errors);*/
 
    Buyer.findOne({ emailAddress: req.body.emailAddress }, function (err, user) {
        if (!user) 
          return res.status(400).send({ msg: 'We were unable to find a user with that email.' });
        if (user.isVerified) 
          return res.status(400).send({ msg: 'This account has already been verified. Please log in.' });
 
        var token = new Token({ 
          _userId: user._id, 
          token: crypto.randomBytes(16).toString('hex') });
 
        token.save(function (err) {
            if (err) { 
              return res.status(500).send(
                { msg: err.message }); 
            }
          
            var mailOptions = {
              from: 'peter@uniteprocurement.com',
              to: user.emailAddress,
              subject: 'Account Verification Token',
              text:
                        "Hello,\n\n" +
                        "Please verify your account by clicking the link: \nhttp://" +
                        req.headers.host +
                        "/buyer/confirmation/" +
                        token.token +
                        "\n"
            };
          
              sgMail.send(mailOptions, function (err, info) {
                 if (err ) {
                  console.log(err);
                }  else {
                  console.log('Message sent: ' + info.response);
                }
                  if (err) {
                    return res.status(500).send({ msg: err.message });
                  }
                  return res.status(200).send('A verification email has been sent to ' + user.emailAddress + '.');
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
}


exports.getSignUp = (req, res) => {
  if (!req.session.organizationId)
    return res.render("buyer/sign-up", {
      errorMessage: req.flash("error")
    });
  else res.redirect("/buyer");
}


exports.getBalance = (req, res) => {
  res.render("buyer/balance", { balance: req.session.buyer.balance });
}


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
        
        MongoClient.connect(URL, function(err, db) {
          if (err) throw err;
          var dbo = db.db(BASE);
          var myquery = { _id: user._id };
          var newvalues = { resetPasswordToken: token, resetPasswordExpires: Date.now() + 86400000};
          dbo.collection("buyers").updateOne(myquery, newvalues, function(err, res) {        
            if(err) {
              console.error(err.message);
              return false;
            }

            db.close();
          });
        });
        /*
        user.save(function(err) {
          done(err, token, user);
        });*/
      });
    },
    function(token, user, done) {
      var emailOptions = {
        from: 'peter@uniteprocurement.com',
        to: user.emailAddress, 
        subject: 'UNITE Password Reset - Buyer', 
        text:
            "Hello,\n\n" +
            "You have received this e-mail because you requested a Buyer password reset on our UNITE platform." +
            " Please reset your password within 24 hours, by clicking the link: \nhttp://" + req.headers.host + "/buyer/reset/" + token + "\n"
      };
      
      sgMail.send(emailOptions, function (err, info) {
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
    res.render('buyer/resetPassword', {token: req.params.token});
  });
}


exports.postResetPasswordToken = (req, res) => {
  async.waterfall([
    function(done) {
      Buyer.findOne({resetPasswordToken: req.params.token, 
                     resetPasswordExpires: { $gt: Date.now() }
                    }, function(err, user) {
      if(!user) {
        req.flash('error', 'Password reset token is either invalid or expired.');
        return res.redirect('back');
      }
        
    if(req.body.password === req.body.confirm) {
      MongoClient.connect(URL, function(err, db) {
        if (err) throw err;
        var dbo = db.db(BASE);
        var myquery = { _id: user._id };
        var newvalues = { password: req.body.password, resetPasswordToken: undefined, resetPasswordExpires: undefined};
        dbo.collection("buyers").updateOne(myquery, newvalues, function(err, res) {        
          if(err) {
            console.error(err.message);
            return false;
          }

          db.close();
        });
      });
        /*
        user.setPassword(req.body.password, function(err) {
          user.save(function(err, done) {
            //req.logIn(user, function(err) {
              done(err, user);
            //});
          });
        })*/
      } else {
        req.flash('error', 'Passwords do not match.');
        return res.redirect('back');
      }
    });
    },
    function(user, done) {
      var emailOptions = {
        from: 'peter@uniteprocurement.com',
        to: user.emailAddress, 
        subject: 'UNITE Password changed - Buyer', 
        text: 'Hello,\n\n' 
        + 'You have successfully reset your Buyer password on our UNITE platform'
        + ' for the account registered with ' + user.emailAddress + '. You can log in again.'        
      };
      
      sgMail.send(emailOptions, function (err, info) {
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
    Buyer.findOne({ emailAddress: email, password: password}, (err, doc) => {
      if (err) return console.error(err);

      if (!doc) {
        req.flash("error", "Invalid e-mail address or password");
        return res.redirect("/buyer/sign-in");
      }
/*
      bcrypt.compare(password, doc.password, function(err, res) {console.log(res);
        if (err) {
            console.log(err);
            if (err) return console.error(err);
            res.redirect("/buyer");
        }
        if (res) {
          req.session.organizationId = doc._id;
          req.session.buyer = doc;
          // Make sure the user has been verified
          if (!doc.isVerified) 
            return res.status(401).send({
              type: 'not-verified', 
              msg: 'Your account has not been verified. Please check your e-mail for instructions.' });

          req.session.cookie.originalMaxAge = req.body.remember? null : 7200000;//Two hours if not remembered
          console.log(req.session.cookie);  
          return req.session.save();
        } else {
              req.flash("error", "Passwords do not match!");
              res.redirect("/buyer/sign-in");
        }
      });*/
    try {
      bcrypt
        .compare(password, doc.password)
        .then((doMatch) => {
          if (doMatch || (password === doc.password && email === doc.emailAddress)) {
            req.session.organizationId = doc._id;
            req.session.buyer = doc;
           
            if (!doc.isVerified)
              return res.status(401).send({
                type: 'not-verified', 
                msg: 'Your account has not been verified. Please check your e-mail for instructions.' });
            
            req.session.cookie.originalMaxAge = req.body.remember? null : 7200000;
            return req.session.save();
          } else {
            req.flash("error", "Passwords and e-mail do not match!");
            res.redirect("/buyer/sign-in");
          }
        })
        .then((err) => {
          if (err) {
          console.error(err);
          res.redirect("/buyer/sign-in");
          }
        
        res.redirect('/buyer');
        })
        .catch(console.error);
      } catch {
        res.redirect("/buyer/sign-in");
      }
    });
  }
}


let global = 0;
function getSupers(id) {
  var promise = Supervisor.find({organizationUniteID: id}).exec();
  return promise;
}

exports.postSignUp = (req, res) => {
  if (req.body.emailAddress) {
    const email = req.body.emailAddress;
    const email_str_arr = email.split("@");
    const domain_str_location = email_str_arr.length - 1;
    const final_domain = email_str_arr[domain_str_location];
    var prohibitedArray = ["gmail.com", "hotmail.com", "outlook.com", "yandex.com", "yahoo.com", "gmx"];
    
    for(var i = 0; i < prohibitedArray.length; i++)
    if (final_domain.toLowerCase().includes(prohibitedArray[i].toLowerCase())) {
      req.flash("error", "E-mail address must be a custom company domain.");
      res.redirect("back");
    } else {
      if (req.body.password.length < 6) {
        req.flash("error", "Password must have at least 6 characters.");
        res.redirect("back");
      } else {
        var promise = getSupers(req.body.organizationUniteID);
        
        promise.then(function(supers) {
          if(!supers || supers.length == 0) {
            req.flash("error", "Invalid UNITE ID. Please select an appropriate ID from the list.");
            res.redirect("back");
          } else if(global++ < 1) {        
          Buyer.findOne({ emailAddress: req.body.emailAddress }, function (err, user) {
            if (user)
              return res.status(400).send({ msg: 'The e-mail address you have entered is already associated with another account.'});
            var buyer;
        try {
          bcrypt.hash(req.body.password, 10, function(err, hash) {
              buyer = new Buyer({
                organizationName: req.body.organizationName,
                organizationUniteID: req.body.organizationUniteID,
                contactName: req.body.contactName,
                emailAddress: req.body.emailAddress,
                password: req.body.password,          
                isVerified: false,
                contactMobileNumber: req.body.contactMobileNumber,
                address: req.body.address,
                balance: req.body.balance,
                deptAgencyGroup: req.body.deptAgencyGroup,
                qualification: req.body.qualification,
                country: req.body.country,
                createdAt: Date.now(),
                updatedAt: Date.now()
              });

              buyer.save((err) => {
                if (err) {
                   return console.error(err.message);
                }
                
              req.session.buyer = buyer;
              req.session.id = buyer._id;
              req.session.save();

              var token = new Token({ 
                _userId: buyer._id,
                token: crypto.randomBytes(16).toString('hex')
              });

              token.save(function (err) {
                if (err) {
                  console.error(err.message);
                  //return res.status(500).send({
                   // msg: err.message 
                 // });
                }
                    var email = {
                      from: 'peter@uniteprocurement.com',
                      to: buyer.emailAddress, 
                      subject: 'Account Verification Token',
                      text: 
                        "Hello " + buyer.organizationName +
                        ",\n\nCongratulations for registering on the UNITE Public Procurement Platform!\n\nPlease verify your account by clicking the link: \nhttp://" 
                      + req.headers.host + "/buyer/confirmation/" + token.token + "\n"
                    };

                    sgMail.send(email, function (err, info) {
                       if (err ) {
                        console.log(err.message);
                         return res.status(500).send({
                            msg: err.message 
                          });
                      }
                      
                        console.log('A verification email has been sent to ' + buyer.emailAddress + '.');
                        req.flash('success', 'A verification email has been sent to ' + buyer.emailAddress + '.');
                        req.flash("success", "Buyer signed up successfully!");
                        return res.redirect("/buyer");
                        //return res.status(200).send('A verification email has been sent to ' + buyer.emailAddress + '.');
                      });
                    });
                  });
                //return resolve(buyer);
              //});
            });
          } catch {
            res.redirect('/buyer/sign-up');
          }
        });
        }
        })        
        .catch(console.error);
      }
    }
  }
}


exports.getProfile = (req, res) => {
  res.render("buyer/profile", {
    profile: req.session.buyer 
  });
};

exports.postProfile = (req, res) => {
  try {
    Buyer.findOne({ _id: req.body._id }, (err, doc) => {
      if (err) 
        return console.error(err);
      doc._id = req.body._id;
      doc.organizationName = req.body.organizationName;
      doc.organizationUniteID = req.body.organizationUniteID;
      doc.contactName = req.body.contactName;
      doc.emailAddress = req.body.emailAddress;
      doc.password = req.body.password;
      doc.isVerified = req.body.isVerified;
      doc.contactMobileNumber = req.body.contactMobileNumber;
      doc.address = req.body.address;
      doc.balance = req.body.balance;
      doc.deptAgencyGroup = req.body.deptAgencyGroup;
      doc.qualification = req.body.qualification;
      doc.country = req.body.country;
      doc.createdAt = req.body.createdAt;
      doc.updatedAt = Date.now();

      MongoClient.connect(URL, {useUnifiedTopology: true}, function(err, db) {
        if (err) throw err;
        var dbo = db.db(BASE);
        var myquery = { _id: doc._id };
        var newvalues = { $set: doc };
        dbo.collection("buyers").updateOne(myquery, newvalues, function(err, res) {        
          if(err) {
            return console.error(err.message);          
          }

          req.session.buyer = doc;
          req.session.id = doc._id;
          req.session.save();
          req.flash("success", "Buyer details updated successfully!");
          db.close();
          return res.redirect("/buyer");
        });
      });
    })    
      .catch(console.error);
  } catch {
  res.redirect('/buyer/profile');
  }
}