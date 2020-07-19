const bcrypt = require("bcryptjs");
const Supplier = require("../models/supplier");
const Buyer = require("../models/buyer");
const BidRequest = require("../models/bidRequest");
const BidStatus = require("../models/bidStatus");
const ProductService = require("../models/productService");
const Capability = require("../models/capability");
const Industry = require("../models/industry");
const Message = require("../models/message");
const Token = require("../models/userToken");
const assert = require("assert");
const process = require("process");
const { basicFormat, customFormat, normalFormat } = require("../middleware/dateConversions");
const async = require("async");
const crypto = require('crypto');
//sgMail.setApiKey('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');
//process.env.SENDGRID_API_KEY = "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";
const MongoClient = require("mongodb").MongoClient;
const ObjectId = require("mongodb").ObjectId;
const URL = process.env.MONGODB_URI, BASE = process.env.BASE;
const treatError = require('../middleware/treatError');
const search = require('../middleware/searchFlash');
var Recaptcha = require('express-recaptcha').RecaptchaV3;
const { sendConfirmationEmail, sendCancellationEmail, sendExpiredBidEmails, sendInactivationEmail, resendTokenEmail, sendForgotPasswordEmail, sendResetPasswordEmail, sendCancelBidEmail, prel, sortLists, getUsers, getBidStatusesJson, getCancelTypesJson, postSignInBody, updateBidBody } = require('../middleware/templates');
const { removeAssociatedBuyerBids, removeAssociatedSuppBids, buyerDelete, supervisorDelete, supplierDelete } = require('../middleware/deletion');
const captchaSiteKey = process.env.RECAPTCHA_V2_SITE_KEY;
const captchaSecretKey = process.env.RECAPTCHA_V2_SECRET_KEY;
const fetch = require('node-fetch');
var fx = require('money'), initConversions = require('../middleware/exchangeRates');
const Country = require('../models/country');
const personalToken = process.env.TOKEN_IP;
const TYPE = process.env.USER_SUPPLIER;
const internalIp = require('internal-ip');
const { verifyBanNewUser, verifyBanExistingUser } = require('../middleware/verifyBanned');
const fs = require('fs');


exports.getIndex = (req, res) => {
  if (!req || !req.session) 
    return false;
  const supplier = req.session.supplier;
  var success = search(req.session.flash, 'success'), error = search(req.session.flash, 'error');
  req.session.flash = [];

  BidRequest.find({ supplier: supplier._id })
    .then((requests) => {
      const requestsCount = requests.length;

      res.render("supplier/index", {
        supplier: supplier,
        requestsCount: requestsCount,
        successMessage: success,
        errorMessage: error
      });
    })
    .catch(console.error);
}


exports.getAddProduct = (req, res) => {
  var success = search(req.session.flash, 'success'), error = search(req.session.flash, 'error');
  req.session.flash = [];
  
  res.render("supplier/addProduct", {
    supplierId: req.session.supplier._id,
    successMessage: success,
    errorMessage: error
  });
}


exports.postAddProduct = (req, res) => {
  if (!req.body.productPrice) {
    console.error("Price is not valid, please correct it.");
    req.flash('error', 'Price is not valid, please correct it.');
    return res.redirect("back");
  } else {
    const product = new ProductService({
      supplier: req.body._id,
      productName: req.body.productName,
      price: parseFloat(req.body.price).toFixed(2),
      productImage: req.body.productImage,
      currency: req.body.currency ? req.body.currency : process.env.SUPP_DEFAULT_CURR,
      amount: parseInt(req.body.amount),
      totalPrice: parseFloat(req.body.price * req.body.amount).toFixed(2),
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
}


exports.getCancelBid = (req, res) => {
  var success = search(req.session.flash, 'success'), error = search(req.session.flash, 'error');
  req.session.flash = [];
  
  res.render('supplier/cancelBid', {
    bidId: req.params.bidId,
    bidName: req.params.bidName,
    userType: req.params.userType,
    buyerName: req.params.buyerName,
    supplierName: req.params.supplierName,
    buyerEmail: req.params.buyerEmail,
    supplierEmail: req.params.supplierEmail,
    successMessage: success,
    errorMessage: error
  });  
}


exports.postCancelBid = (req, res) => {
  //BidRequest.findOne({_id: req.params.bidId});
  try {
  MongoClient.connect(URL, {useUnifiedTopology: true}, async function(err, db) {
      if(treatError(req, res, err, 'back'))
        return false;
      var dbo = db.db(BASE);
    
      try {
        await dbo.collection('cancelreasons').insertOne( {
          title: req.body.cancelTitle,
          cancelType: process.env.BID_CANCEL_TYPE,
          userType: req.body.userType,
          reason: req.body.reason,
          userName: req.body.suppliersName,
          createdAt: Date.now()
        }, function(err, obj) {
          if(treatError(req, res, err, 'back'))
            return false;
        });
      }
      catch(e) {
        console.error(e);
        req.flash('error', e.message);
      }//Cancelled bids, either by Buyer or by Supplier, do not have an expiry date any longer:
    
      await dbo.collection("bidrequests").updateOne({ _id: new ObjectId(req.body.bidId) }, { $set: { isCancelled: true, expiryDate: null, expiryDateFormatted: null, status: parseInt(process.env.SUPP_BID_CANCEL)} }, async function(err, resp) {
        if(err) {
          console.error(err.message);
          return res.status(500).send({ 
            msg: err.message 
          });         
        }

        await sendCancelBidEmail(req, req.body.buyersName, req.body.suppliersName, req.body.buyersEmail, req.body.suppliersEmail, 'Buyer ', 'Supplier ', req.body.reason);
        return res.redirect('back');
      });
    
    db.close();
    });
  } catch {
    //return res.redirect('/supplier/index');
  }  
}


exports.getConfirmation = (req, res) => {
  if(!req.session || !req.session.supplierId) {
    req.session = req.session? req.session : {};
    req.session.supplierId = req.params && req.params.token? req.params.token._userId : null;
  }
  
  var success = search(req.session.flash, 'success'), error = search(req.session.flash, 'error');
  req.session.flash = [];
  
  res.render("supplier/confirmation", { 
    token: req.params? req.params.token : null,
    successMessage: success,
    errorMessage: error
  });
}

exports.getDelete = (req, res) => {
  var success = search(req.session.flash, 'success'), error = search(req.session.flash, 'error');
  req.session.flash = [];
  
  res.render('supplier/delete', {
    id: req.params.id,
    cancelReasonTypesJson: JSON.stringify(getCancelTypesJson()),
    successMessage: success,
    errorMessage: error
  });
}

exports.getDeactivate = (req, res) => {
  var success = search(req.session.flash, 'success'), error = search(req.session.flash, 'error');
  req.session.flash = [];
  
  res.render('supplier/deactivate', {
    id: req.params.id,
    successMessage: success,
    errorMessage: error
  });
}

exports.getResendToken = (req, res) => {
  var success = search(req.session.flash, 'success'), error = search(req.session.flash, 'error');
  req.session.flash = [];
  
  res.render("supplier/resend", {
    successMessage: success,
    errorMessage: error
  });
}


exports.postDelete = function (req, res, next) {  
  var id = req.body.id;
  supplierDelete(req, res, id);
}


exports.postDeactivate = function (req, res, next) {  
  var id = req.body.id;
  try {
    //Delete Supplier's Capabilities first:
    MongoClient.connect(URL, {useUnifiedTopology: true}, async function(err, db) {
      if(treatError(req, res, err, 'back'))
        return false;
      var dbo = db.db(BASE);
      /*
      try {
        await dbo.collection('cancelreasons').insertOne( {//To replace with a possible InactivationReason.
          type: req.body.type,
          reason: req.body.reason,
          userType: req.body.userType,
          userName: req.body.companyName,
          createdAt: Date.now()
        }, function(err, obj) {});
      } catch(e) {
        console.error(e);
      }*/
      
      await dbo.collection('capabilities').deleteMany({ supplier: id }, function(err, resp) {
        if(treatError(req, res, err, 'back'))
          return false;
      });
        
      //Products/Services offered:
      await dbo.collection('productservices').deleteMany({ supplier: id }, function(err, resp0) {
        if(treatError(req, res, err, 'back'))
          return false;
      });    
    
      //The received bids:
      await removeAssociatedSuppBids(req, dbo, id);

      //And now, deactivate the Supplier themselves:
      await dbo.collection('suppliers').updateOne( { _id: id }, { $set: { isActive: false } }, function(err, resp4) {
        if(treatError(req, res, err, 'back'))
          return false;
      });

      //Finally, send a mail to the ex-Supplier:
      await sendCancellationEmail('Supplier', req, 'received orders, products/services offered, listed capabilities', req.body.reason);
      db.close();
      req.flash('success', 'You have deactivated your Supplier account. Logging in will reactivate you.');
      return res.redirect("/supplier/sign-in");
    });
  } catch {
    //return res.redirect("/supplier");
  }
}


exports.postConfirmation = async function(req, res, next) {
  //assert("token", "Token cannot be blank").notEmpty();
  //req.sanitize("emailAddress").normalizeEmail({ remove_dots: false });
  //var errors = req.validationErrors();
  //if (errors) return res.status(400).send(errors);  

  await Token.findOne({ token: req.params.token, userType: TYPE }, async function(err, token) {
    if (!token) {
      req.flash(
        'error', "We were unable to find a valid token. It may have expired. Please request a new confirmation token."
      );
  
      return res.redirect("/supplier/resend");
    }
  
    await Supplier.findOne({ _id: token._userId, emailAddress: req.body.emailAddress }, async function (err, user) {
      if (!user) 
        return res.status(400).send({
        msg: 'We were unable to find a user for this token.' 
      });

      if (user.isVerified) 
        return res.status(400).send({ 
        type: 'already-verified', 
        msg: 'This user has already been verified.' });
      

      await MongoClient.connect(URL, {useUnifiedTopology: true}, async function(err, db) {//db or client.
        if(treatError(req, res, err, 'back'))
          return false;
        var dbo = db.db(BASE);
            
        await dbo.collection("suppliers").updateOne({ _id: user._id }, { $set: { isVerified: true, isActive: true } }, function(err, resp) {
              if(err) {
                res.status(500).send(err.message);
              }
        });

        console.log("The account has been verified. Please log in.");
        req.flash('success', "The account has been verified. Please log in.");
        db.close();
        res.status(200).send("The account has been verified. Please log in.");
      });
    });         
  });
}


exports.postResendToken = function(req, res, next) {
  Supplier.findOne({ emailAddress: req.body.emailAddress }, function(err, user) {
    if (!user)
      return res
        .status(400)
        .send({ msg: "We were unable to find a user with that email." });
    if (user.isVerified)
      return res.status(400).send({
        msg: "This account has already been verified. Please log in."
      });

    var token = new Token({
      _userId: user._id,
      userType: TYPE,
      token: crypto.randomBytes(16).toString("hex")
    });

    // Save the token
    token.save(async function(err) {
      if (err) {
        return res.status(500).send({ msg: err.message });
      }

      await resendTokenEmail(user, token.token, '/supplier/confirmation/', req);
      return res.status(200).send('A verification email has been sent to ' + user.emailAddress + '.');
    });
  });
}


exports.getSignIn = (req, res) => {
  if (!req.session.supplierId || !req.session.supplier.isVerified) {
    var success = search(req.session.flash, 'success'), error = search(req.session.flash, 'error');
    req.session.flash = [];
    
    return res.render("supplier/sign-in", {
      captchaSiteKey: captchaSiteKey,
      successMessage: success,
      errorMessage: error
    });
  } else 
    return res.redirect("/supplier");
}


exports.postSignIn = async (req, res) => {
  postSignInBody('supplier', req, res);
}


exports.getSignUp = (req, res) => {
  var success = search(req.session.flash, 'success'), error = search(req.session.flash, 'error');
  req.session.flash = [];
  
  if (!req.session.supplierId) {
    Country.find({}).then((countries) => {
      Industry.find({}).then((industries) => {
        
          var success = search(req.session.flash, 'success'), error = search(req.session.flash, 'error');
          req.session.flash = [];

          var country = [], industry = [], product = [];
          
          for(var i in countries) {
            country.push({id: i, name: countries[i].name});
          }

          for(var i in industries) {
            industry.push({id: i, name: industries[i].name});
          }        
    
          return res.render("supplier/sign-up", {
            MAX_PROD: process.env.SUPP_MAX_PROD,
            DEFAULT_CURR: process.env.SUPP_DEFAULT_CURR,
            countries: country,
            industries: industry,
            captchaSiteKey: captchaSiteKey,
            successMessage: success,
            errorMessage: error
          });
        });      
    });
  }
  else 
    return res.redirect("/supplier");
};


let global = 0;
exports.postSignUp = async (req, res) => {
  const captchaVerified = await fetch('https://www.google.com/recaptcha/api/siteverify?secret=' + captchaSecretKey + '&response=' + req.body.captchaResponse, {method: 'POST'})
  .then((res0) => res0.json());
  
  const ipv4 = await internalIp.v4();
  console.log(captchaVerified);
  
  if(((req.body.captchaResponse).length == 0) || captchaVerified.success === true) {
    if(req.body.emailAddress) {
      const email = req.body.emailAddress;
      const email_str_arr = email.split("@");
      const domain_str_location = email_str_arr.length - 1;
      const final_domain = email_str_arr[domain_str_location];
      var prohibitedArray = ["gmaid.com", "hotmaix.com", "outloop.com", "yandex.com", "yahuo.com", "gmx"];

      for (var i = 0; i < prohibitedArray.length; i++)
        if (final_domain.toLowerCase().includes(prohibitedArray[i].toLowerCase())) {
          req.flash("error", "E-mail address must belong to a custom company domain.");
          return res.redirect("/supplier/sign-up"); //supplier/sign-up
          
        } else {
          if (req.body.password.length < 6) {
            req.flash("error", "Password must have at least 6 characters.");
            return res.redirect("/supplier/sign-up");
            var supplier;
            
            //Prevent duplicate attempts:
          } else if (global++ < 1) {
            await Supplier.findOne({ emailAddress: req.body.emailAddress }, async function(err,  user) {
              if(treatError(req, res, err, '/supplier/sign-up'))
                return false;

              const ipv4 = await internalIp.v4();
              
              if(verifyBanNewUser(req, res, req.body.emailAddress, ipv4)) {
                return res.status(400).send({
                  msg: 'You are trying to join UNITE from the part of an already banned user. Please refrain from doing so.'
                });
              }
              
              if (user)
                return res.status(400).send({
                  msg:
                    "The e-mail address you have entered is already associated with another account."
                });
            }).catch(console.error);

            try {
              await bcrypt.hash(req.body.password, 16, async function(err, hash) {
                  var productList = prel(req.body.productsServicesOffered);
                  var amountsList = prel(req.body.amountsList, false, true);
                  var pricesList = prel(req.body.pricesList, true, false);
                  var imagesList = prel(req.body.productImagesList);
                  var currenciesList = prel(req.body.currenciesList);
                  sortLists(productList, amountsList, pricesList, imagesList, currenciesList);
                
                  supplier = new Supplier({
                    role: process.env.USER_REGULAR,
                    avatar: req.body.avatar,
                    companyName: req.body.companyName,
                    directorsName: req.body.directorsName,
                    contactName: req.body.contactName,
                    title: req.body.title,
                    companyRegistrationNo: req.body.companyRegistrationNo,
                    emailAddress: req.body.emailAddress,
                    password: hash,
                    isVerified: false,
                    isActive: false,
                    ipv4: ipv4,
                    registeredCountry: req.body.registeredCountry,
                    companyAddress: req.body.companyAddress,
                    areaCovered: req.body.areaCovered,
                    contactMobileNumber: req.body.contactMobileNumber,
                    country: req.body.country,
                    industry: req.body.industry,
                    employeeNumbers: req.body.employeeNumbers,
                    lastYearTurnover: req.body.lastYearTurnover,
                    website: req.body.website,
                    productsServicesOffered: productList,
                    pricesList: pricesList,
                    currenciesList: currenciesList,
                    productImagesList: imagesList,
                    amountsList: amountsList,
                    totalSupplyPrice: req.body.totalSupplyPrice,
                    totalSupplyAmount: req.body.totalSupplyAmount,
                    capabilityDescription: req.body.capabilityDescription,
                    relevantExperience: req.body.relevantExperience,
                    supportingInformation: req.body.supportingInformation,
                    certificates: req.body.certificatesIds,
                    antibriberyPolicy: req.body.antibriberyPolicyId,
                    environmentPolicy: req.body.environmentPolicyId,
                    qualityManagementPolicy: req.body.qualityManagementPolicyId,
                    occupationalSafetyAndHealthPolicy: req.body.occupationalSafetyAndHealthPolicyId,
                    otherRelevantFiles: req.body.otherRelevantFilesIds,
                    certificatesIds: req.body.certificatesIds,
                    antibriberyPolicyId: req.body.antibriberyPolicyId,
                    environmentPolicyId: req.body.environmentPolicyId,
                    qualityManagementPolicyId: req.body.qualityManagementPolicyId,
                    occupationalSafetyAndHealthPolicyId: req.body.occupationalSafetyAndHealthPolicyId,
                    otherRelevantFilesIds: req.body.otherRelevantFilesIds,
                    balance: req.body.balance,
                    currency: req.body.currency,
                    facebookURL: req.body.facebookURL,
                    instagramURL: req.body.instagramURL,
                    twitterURL: req.body.twitterURL,
                    linkedinURL: req.body.linkedinURL,
                    otherSocialMediaURL: req.body.otherSocialMediaURL,
                    UNITETermsAndConditions: true,//We assume that user was constrainted to check them.
                    antibriberyAgreement: true,
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                    createdAtFormatted: normalFormat(Date.now()),
                    updatedAtFormatted: normalFormat(Date.now())
                  });

                  await supplier.save(async (err) => {
                    if (err) {
                      req.flash('error', err.message);
                      console.error(err);
                       return res.status(500).send({
                           msg: err.message
                           });
                    }                  

                    req.session.supplier = supplier;
                    req.session.supplierId = supplier._id;
                    await req.session.save();
                    
                    //if(req.body.saveCapability.length) {
                      var capability = new Capability({
                        supplier: supplier._id,
                        capabilityDescription: supplier.capabilityDescription,
                        createdAt: Date.now(),
                        updatedAt: Date.now()
                      });

                      await capability.save(function(err) {
                        if(treatError(req, res, err, '/supplier/sign-up'))
                          return false;
                        console.log('Capability saved!');
                      });
                    //}

                    var token = new Token({
                      _userId: supplier._id,
                      userType: TYPE,
                      token: crypto.randomBytes(16).toString("hex")
                    });

                    await token.save(async function(err) {
                      if (err) {
                        req.flash('error', err.message);
                        console.error(err.message);
                        return res.status(500).send({
                          msg: err.message
                         });
                          }
                    });
                    
                      if(req.body.saveIndustry.length) {
                        var industry = new Industry({
                          name: req.body.industry
                        });

                        industry.save((err) => {
                          if(treatError(req, res, err, '/supplier/sign-up'))
                            return false;//If that industry already exists.
                        });
                      }

                    await sendConfirmationEmail(supplier.companyName, "/supplier/confirmation/", token.token, req);

                    if (Array.isArray(supplier.productsServicesOffered)) {
                      for (var i in supplier.productsServicesOffered) {
                        var productService = new ProductService({
                          supplier: supplier._id,
                          productName: supplier.productsServicesOffered[i],
                          price: parseFloat(supplier.pricesList[i]).toFixed(2),
                          currency: supplier.currenciesList[i],
                          productImage: supplier.productImagesList[i].length? supplier.productImagesList[i] : '',
                          amount: parseInt(supplier.amountsList[i]),
                          totalPrice: parseFloat(supplier.pricesList[i] * supplier.amountsList[i]).toFixed(2),
                          createdAt: Date.now(),
                          updatedAt: Date.now()
                        });

                        await productService.save((err) => {
                          if(treatError(req, res, err, '/supplier/sign-up'))
                            return false;
                        });
                      }

                    console.log('All products saved!');
                    req.flash("success", "Supplier signed up successfully! Please confirm your account by visiting " + req.body.emailAddress + '');
                    setTimeout(function() {
                        return res.redirect("/supplier/sign-in");
                      }, 250);
                    }
              });
            });
         } catch {              
         }
        }
      }
    }
  } else {
      req.flash('error', 'Captcha failed!')
      res.redirect('back');
    }
}


exports.getForgotPassword = (req, res) => {
  var success = search(req.session.flash, 'success'), error = search(req.session.flash, 'error');
  req.session.flash = [];
  
  res.render("supplier/forgotPassword", {
    email: req.session.supplier.emailAddress,
    successMessage: success,
    errorMessage: error
  });
}


exports.getChatLogin = (req, res) => {//We need a username, a room name, and a socket-based ID.
  var success = search(req.session.flash, 'success'), error = search(req.session.flash, 'error');
  req.session.flash = [];  
  
  res.render("supplier/chatLogin", {
    successMessage: success,
    errorMessage: error,
    from: req.params.supplierId,
    to: req.params.buyerId,
    fromName: req.params.supplierName,
    toName: req.params.buyerName,
    reqId: req.params.requestId? req.params.requestId : 0,
    reqName: req.params.requestName? req.params.requestName : 'None'
  });
}


exports.getChat = (req, res) => {//Coming from the getLogin above.
  var success = search(req.session.flash, 'success'), error = search(req.session.flash, 'error');
  req.session.flash = [];
  
  res.render("supplier/chat", {
    successMessage: success,
    errorMessage: error,
    from: req.params.from,
    to: req.params.to,
    username: req.params.username,
    room: req.params.room,
    fromName: req.params.fromName,
    toName: req.params.toName,
    reqId: req.params.reqId,
    reqName: req.params.reqName
  });
}


exports.postForgotPassword = (req, res, next) => {
  async.waterfall(
    [
      function(done) {
        crypto.randomBytes(20, function(err, buf) {
          var token = buf.toString("hex");
          done(err, token);
        });
      },
      function(token, done) {
        Supplier.findOne({ emailAddress: req.body.emailAddress }, function (err, user) {
          if (!user) {
            req.flash('error', 'Sorry. We were unable to find a user with this e-mail address.');
            return res.redirect('supplier/forgotPassword');
          }

          MongoClient.connect(URL, {useUnifiedTopology: true}, function(err, db) {
            if(treatError(req, res, err, 'back'))
              return false;
            
            var dbo = db.db(BASE);
            dbo.collection("suppliers").updateOne({ _id: user._id }, { $set: {resetPasswordToken: token, resetPasswordExpires: Date.now() + 86400000} }, function(err, resp) {        
              if(treatError(req, res, err, 'back'))
                return false;
              db.close();
            });
          });
        });
      },
      function(token, user, done) {
        sendForgotPasswordEmail(user, 'Supplier', "/supplier/reset/", token, req);
      }
    ],
    function(err) {
      if(treatError(req, res, err, 'back'))
        return false;
      return res.redirect("/supplier/forgotPassword");
    });
};

exports.getResetPasswordToken = (req, res) => {
  var success = search(req.session.flash, 'success'), error = search(req.session.flash, 'error');
  req.session.flash = [];
  
  Supplier.findOne({
      resetPasswordToken: req.params.token,
      resetPasswordExpires: { $gt: Date.now() }
    }, function(err, user) {
      if (!user) {
        req.flash("error", "Password reset token is either invalid or expired.");
        return res.redirect("supplier/forgotPassword");
      }
      res.render("supplier/resetPassword", { 
        token: req.params.token,
        successMessage: success,
        errorMessage: error
      });
    });
};

exports.postResetPasswordToken = (req, res) => {
  async.waterfall([
    function(done) {
      Supplier.findOne({resetPasswordToken: req.params.token, 
                     resetPasswordExpires: { $gt: Date.now() }
                    }, function(err, user) {
      if(!user) {
        req.flash('error', 'Password reset token is either invalid or expired.');
        return res.redirect('back');
      }
        
    if(req.body.password === req.body.passwordRepeat) {
        MongoClient.connect(URL, {useUnifiedTopology: true}, function(err, db) {
          if(treatError(req, res, err, 'back'))
            return false;
          var dbo = db.db(BASE);
          let hash = bcrypt.hashSync(req.body.password, 16);
          
          dbo.collection("suppliers").updateOne({ _id: user._id }, 
            { $set: {
              password: hash, 
              resetPasswordToken: undefined, 
              resetPasswordExpires: undefined } },

            function(err, resp) {
            if(treatError(req, res, err, 'back'))
              return false;
            db.close();
          });
        });
      } else {
        req.flash('error', 'Passwords do not match.');
        return res.redirect('back');
      }
    });
    },
      function(user, done) {
        sendResetPasswordEmail(user, 'Supplier', req);
      }
    ],
    function(err) {
      if(treatError(req, res, err, 'back'))
        return false;
      return res.redirect("/supplier");
    }
  );
}


function generateData(countries, industries) {
  $.get(`https://ipinfo.io?token=${personalToken}`, function(response) {
  console.log(response.ip, response.country);
  }, "jsonp")
}


function fileExists(path) {
  return fs.existsSync(path);
}


exports.getProfile = (req, res) => {
  if (!req || !req.session) 
    return false;
  console.log(5);
  console.log(req.connection.remoteAddress);  
  const supplier = req.session.supplier;
  ProductService.find({ supplier: supplier._id })
    .then((products) => {
      products.sort(function(a, b) {
        return a.productName.localeCompare(b.productName);
      });
    
      req.session.supplier.productsServicesOffered = [];
    
      for(var i in products) {
        req.session.supplier.productsServicesOffered.push(products[i].productName);
      }
    
    Country.find({}).then((countries) => {
      Industry.find({}).then((industries) => {
        Capability.find({}).then((caps) => {
          var success = search(req.session.flash, 'success'), error = search(req.session.flash, 'error');
          req.session.flash = [];

          var country = [], industry = [], cap = [], product = [];
          
          for(var i in countries) {
            country.push({id: i, name: countries[i].name});
          }

          for(var i in industries) {
            industry.push({id: i, name: industries[i].name});
          }
          
          for(var i in caps) {
            cap.push({id: i, name: caps[i].capabilityDescription});
          }
          
          cap.sort(function (a, b) {
            return a.name.localeCompare(b.name);
          });

          for(var i in products) {
            product.push({
              id: i,
              price: products[i].price,
              amount: products[i].amount,
              productName: products[i].productName,
              currency: products[i].currency,
              totalPrice: products[i].totalPrice,
              productImage: fileExists(products[i].productImage) == true? products[i].productImage : ''
            });
          }

          res.render("supplier/profile", {
            products: product,
            countries: country,
            industries: industry,
            capabilities: cap,
            MAX_PROD: process.env.SUPP_MAX_PROD,
            DEFAULT_CURR: process.env.SUPP_DEFAULT_CURR,
            successMessage: success,
            errorMessage: error,
            profile: req.session.supplier
          });
        });
      });
    });
    })
    .catch(console.error);
}


exports.getBidRequests = (req, res) => {
  const supplier = req.session.supplier;
  try {
    initConversions(fx);
  } catch {
  }
  
  BidRequest.find({ supplier: supplier._id })
    .then(async (requests) => {
    
      var validBids = [], cancelledBids = [], expiredBids = [];
      if(requests && requests.length) {
        for(var i in requests) {
          var date = Date.now();
          var bidDate = requests[i].expiryDate;
          bidDate > date? 
            (requests[i].isCancelled == true? cancelledBids.push(requests[i]) : validBids.push(requests[i]))
          : expiredBids.push(requests[i]);
        }
      }
    
    await sendExpiredBidEmails(req, res, expiredBids);
    
    var totalPrice = 0, validPrice = 0, cancelledPrice = 0, expiredPrice = 0;
    
    for(var i in validBids) {
      //validPrice += fx(parseFloat(validBids[i].price)).from(validBids[i].currency).to(supplier.currency);
      validPrice += parseFloat(validBids[i].supplierPrice);
    }
    
    totalPrice = parseFloat(validPrice);
    
    for(var i in cancelledBids) {
      cancelledPrice += parseFloat(cancelledBids[i].supplierPrice);
    }
    
    totalPrice += parseFloat(cancelledPrice);
    
    for(var i in expiredBids) {
      expiredPrice += parseFloat(expiredBids[i].supplierPrice);
    }
    
    totalPrice += parseFloat(expiredPrice);
    var success = search(req.session.flash, 'success'), error = search(req.session.flash, 'error');
    req.session.flash = [];
    
    res.render("supplier/bid-requests", {
      successMessage: success,
      errorMessage: error,
      supplier: supplier,
      totalPrice: totalPrice,
      validPrice: validPrice,
      expiredPrice: expiredPrice,
      cancelledPrice: cancelledPrice,
      totalBidLength: requests && requests.length? requests.length : 0,
      supplierCancelBidStatus: process.env.SUPP_CANCEL_BID,
      requests: validBids,
      cancelledRequests: cancelledBids,
      expiredRequests: expiredBids
    });
  })
  .catch(console.error);
};


exports.getBalance = (req, res) => {
  res.render("supplier/balance", { 
    balance: req.session.supplier.balance,
    appId: process.env.EXCH_RATES_APP_ID,
    currency: req.session.supplier.currency
  });
}


exports.getBidRequest = (req, res) => {
  const supplier = req.session.supplier;
  let request;
  const id = req.params.id;
  var success = search(req.session.flash, 'success'), error = search(req.session.flash, 'error');
  req.session.flash = [];

  BidRequest.findOne({ _id: id })
    .then( (reqresult) => {
      request = reqresult;
      return Buyer.findOne({ _id: request.buyer });
    })
    .then((buyer) => {
    if(request.expirationDate <= Date.now() + process.env.DAYS_BEFORE_BID_EXPIRES * process.env.DAY_DURATION) {
      request.warningExpiration = true;
      if(request.isExtended == true) {
        request.cannotExtendMore = true;
      }
    }
    
    var promise = BidStatus.find({}).exec();
    promise.then((statuses) => {
      res.render("supplier/bid-request", {
        supplier: supplier,
        request: request,
        buyer: buyer,
        path: '../',
        bidExtensionDays: process.env.DAYS_BID_EXTENDED,
        successMessage: success,
        errorMessage: error,
        statuses: statuses,
        statusesJson: JSON.stringify(getBidStatusesJson())
        });
      });
    })
    .catch(console.error);
}


exports.postBidRequest = (req, res) => {
  updateBidBody(req, res, req.body.reqId, '/supplier/index');
 }


exports.postProfile = async (req, res) => {
  global = 0;
  const ipv4 = await internalIp.v4();
  
  try {
  await Supplier.findOne({ _id: req.body._id }, async (err, doc) => {
    if(treatError(req, res, err, '/supplier/profile'))
      return false;

    var productList = prel(req.body.productsServicesOffered);
    var amountsList = prel(req.body.amountsList, false, true);
    var pricesList = prel(req.body.pricesList, true, false);
    var imagesList = prel(req.body.productImagesList);
    var currenciesList = prel(req.body.currenciesList);
    sortLists(productList, amountsList, pricesList, imagesList, currenciesList);
    
    doc._id = req.body._id;
    doc.avatar = req.body.avatar;
    doc.role = req.body.role;
    doc.companyName = req.body.companyName;
    doc.directorsName = req.body.directorsName;
    doc.contactName = req.body.contactName;
    doc.title = req.body.title;
    doc.emailAddress = req.body.emailAddress;
    doc.password = req.body.password;
    doc.isVerified = true;
    doc.isActive = true;
    doc.ipv4 = ipv4;
    doc.companyRegistrationNo = req.body.companyRegistrationNo;
    doc.registeredCountry = req.body.registeredCountry;
    doc.balance = req.body.balance;
    doc.currency = req.body.currency;
    doc.companyAddress = req.body.companyAddress;
    doc.areaCovered = req.body.areaCovered;
    doc.contactMobileNumber = req.body.contactMobileNumber;
    doc.country = req.body.country;
    doc.industry = req.body.industry;
    doc.employeeNumbers = req.body.employeeNumbers;
    doc.lastYearTurnover = req.body.lastYearTurnover;
    doc.website = req.body.website;
    doc.productsServicesOffered = productList;
    doc.pricesList = pricesList;
    doc.currenciesList = currenciesList;
    doc.productImagesList = imagesList;
    doc.amountsList = amountsList;
    doc.totalSupplyPrice = req.body.totalSupplyPrice;
    doc.totalSupplyAmount = req.body.totalSupplyAmount;
    doc.capabilityDescription = req.body.capabilityDescription;
    doc.relevantExperience = req.body.relevantExperience;
    doc.supportingInformation = req.body.supportingInformation;
    doc.certificates = req.body.certificatesIds;
    doc.antibriberyPolicy = req.body.antibriberyPolicyId;
    doc.environmentPolicy = req.body.environmentPolicyId;
    doc.qualityManagementPolicy = req.body.qualityManagementPolicyId;
    doc.occupationalSafetyAndHealthPolicy = req.body.occupationalSafetyAndHealthPolicyId;
    doc.otherRelevantFiles = req.body.otherRelevantFilesIds;
    doc.certificatesIds = req.body.certificatesIds;
    doc.antibriberyPolicyId = req.body.antibriberyPolicyId;
    doc.environmentPolicyId = req.body.environmentPolicyId;
    doc.qualityManagementPolicyId = req.body.qualityManagementPolicyId;
    doc.occupationalSafetyAndHealthPolicyId = req.body.occupationalSafetyAndHealthPolicyId;
    doc.otherRelevantFilesIds = req.body.otherRelevantFilesIds;
    doc.facebookURL = req.body.facebookURL;
    doc.instagramURL = req.body.instagramURL;
    doc.twitterURL = req.body.twitterURL;
    doc.linkedinURL = req.body.linkedinURL;
    doc.otherSocialMediaURL = req.body.otherSocialMediaURL;
    doc.UNITETermsAndConditions = req.body.UNITETermsAndConditions == "on" ? true : false;
    doc.antibriberyAgreement = req.body.antibriberyAgreement == "on" ? true : false;
    doc.createdAt = req.body.createdAt;
    doc.updatedAt = Date.now();
    doc.createdAtFormatted = normalFormat(req.body.createdAt);
    doc.updatedAtFormatted = normalFormat(Date.now());
    
    //doc.__v = 1;//Last saved version. To be taken into account for future cases of concurrential changes, in case updateOne does not protect us from that problem.
    var price = req.body.price;
    
    if(global++ < 1)
    await MongoClient.connect(URL, {useUnifiedTopology: true}, async function(err, db) {
      if(treatError(req, res, err, '/supplier/profile'))
        return false;
      
      var dbo = db.db(BASE);
      
      await dbo.collection("suppliers").updateOne({ _id: doc._id }, { $set: doc }, function(err, resp0) {
        if(treatError(req, res, err, '/supplier/profile'))
          return false;
      });

      console.log("Supplier updated!");
      var arr = doc.productsServicesOffered;
      
      if(req.body.saveCapability.length) {
        await dbo.collection("capabilities").deleteMany({ supplier: doc._id }, (err, resp1) => {
          if(treatError(req, res, err, '/supplier/profile'))
            return false;

        
            var capability = new Capability({
            supplier: doc._id,
            capabilityDescription: doc.capabilityDescription,
            createdAt: Date.now(),
            updatedAt: Date.now()
          });

          capability.save((err) => {
            if(treatError(req, res, err, '/supplier/profile'))
              return false;
          });
          console.log('Capability description saved!');
      });
    }
      
      if(req.body.saveIndustry.length) {
        var industry = new Industry({
          name: doc.industry
        });

        industry.save((err) => {
          if(treatError(req, res, err, '/supplier/profile'))
            return false;
        });
      }
      
      console.log('Now saving new data to session:');
      req.session.supplier = doc;
      req.session.supplierId = doc._id;
      await req.session.save((err) => {
        if(treatError(req, res, err, '/supplier/profile'))
          return false;
      });   
     
      await dbo.collection("productservices").deleteMany({ supplier: doc._id }, (err, resp2) => {
        if(treatError(req, res, err, '/supplier/profile'))
          return false;
        
      if (Array.isArray(arr))
        for (var i in arr) {
          if(!doc.pricesList[i]) 
            continue;

          var productService = new ProductService({
            supplier: doc._id,
            productName: arr[i],
            price: parseFloat(doc.pricesList[i]).toFixed(2),
            currency: doc.currenciesList[i],
            productImage: doc.productImagesList[i].length? doc.productImagesList[i] : '',
            amount: parseInt(doc.amountsList[i]),
            totalPrice: parseFloat(doc.pricesList[i] * doc.amountsList[i]).toFixed(2),
            createdAt: Date.now(),
            updatedAt: Date.now()
          });

          productService.save((err) => {
            if(treatError(req, res, err, '/supplier/profile'))
              return false;
          });
          
          console.log('Product saved!');
        }
        
        console.log('Products offered list saved!');
        console.log("User updated and session saved!");
        db.close();
        setTimeout(function() {
          req.flash("success", "Supplier details updated successfully!");
          console.log('Supplier details updated successfully!');
          return res.redirect("/supplier/profile");
          }, 400);
        });
      });
    })
    //.catch(console.error);
  } catch {
    //return res.redirect("/supplier/profile");
  }
};