const bcrypt = require("bcryptjs");
const Supplier = require("../models/supplier");
const Buyer = require("../models/buyer");
const BidRequest = require("../models/bidRequest");
const BidStatus = require("../models/bidStatus");
const ProductService = require("../models/productService");
const Capability = require("../models/capability");
const Industry = require("../models/industry");
const Message = require("../models/message");
const UserToken = require("../models/userToken");
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
let Recaptcha = require('express-recaptcha').RecaptchaV2;

const {
  fileExists,
  sendConfirmationEmail,
  sendCancellationEmail,
  sendExpiredBidEmails,
  sendInactivationEmail,
  resendTokenEmail,
  sendForgotPasswordEmail,
  sendResetPasswordEmail,
  sendCancelBidEmail,
  prel,
  sortLists,
  getObjectMongo,
  getObjectMongoose,
  getDataMongo,
  getDataMongoose,
  getBidStatusesJson,
  renderBidStatuses,
  postSignInBody,
  saveBidBody,
  updateBidBody,
  encryptionNotice,
  getCancelReasonTitles
} = require("../middleware/templates");

const { removeAssociatedBuyerBids, removeAssociatedSuppBids, buyerDelete, supervisorDelete, supplierDelete } = require('../middleware/deletion');
const captchaSiteKey = process.env.RECAPTCHA_V2_SITE_KEY;
const captchaSecretKey = process.env.RECAPTCHA_V2_SECRET_KEY;
const fetch = require('node-fetch');
let fx = require('money'), initConversions = require('../middleware/exchangeRates');
const Country = require('../models/country');
const personalToken = process.env.TOKEN_IP;
const TYPE = process.env.USER_SUPPLIER;
const internalIp = require('internal-ip');
const { verifyBanNewUser, verifyBanExistingUser } = require('../middleware/verifyBanned');
const fs = require('fs');


exports.getIndex = async (req, res) => {
  if (!req || !req.session) 
    return false;
  
  const supplier = req.session.supplier;
  let success = search(req.session.flash, 'success'), error = search(req.session.flash, 'error');
  req.session.flash = [];
  let requests = await getDataMongoose('BidRequest', { supplier: supplier._id }); 
  const requestsCount = requests.length;

  if(supplier.avatar && supplier.avatar.length && !fileExists('public/' + supplier.avatar.substring(3))) {
    supplier.avatar = '';
  }

  res.render("supplier/index", {
    supplier: supplier,
    requestsCount: requestsCount,
    successMessage: success,
    errorMessage: error
  });
}


exports.getAddProduct = (req, res) => {
  let success = search(req.session.flash, 'success'), error = search(req.session.flash, 'error');
  req.session.flash = [];
  
  res.render("supplier/addProduct", {
    supplierId: req.session.supplier._id,
    DEFAULT_CURR: process.env.SUPP_DEFAULT_CURR,
    FILE_UPLOAD_MAX_SIZE: process.env.FILE_UPLOAD_MAX_SIZE,
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


exports.getCancelBid = async (req, res) => {
  let success = search(req.session.flash, 'success'), error = search(req.session.flash, 'error');
  req.session.flash = [];
  let titles = await getCancelReasonTitles(process.env.BID_CANCEL_TYPE, false, false);
  
  res.render('supplier/cancelBid', {
    bidId: req.params.bidId,
    bidName: req.params.bidName,
    userType: req.params.userType,
    buyerName: req.params.buyerName,
    supplierName: req.params.supplierName,
    buyerEmail: req.params.buyerEmail,
    supplierEmail: req.params.supplierEmail,
    titles: titles,
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
      let dbo = db.db(BASE);
    
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
  
  let success = search(req.session.flash, 'success'), error = search(req.session.flash, 'error');
  req.session.flash = [];
  
  res.render("supplier/confirmation", { 
    token: req.params? req.params.token : null,
    successMessage: success,
    errorMessage: error
  });
}


exports.getDelete = async (req, res) => {
  let success = search(req.session.flash, 'success'), error = search(req.session.flash, 'error');
  req.session.flash = [];
  let titles = await getCancelReasonTitles(process.env.USER_CANCEL_TYPE, false, false);
  
  res.render('supplier/delete', {
    id: req.params.id,
    titles: titles,
    successMessage: success,
    errorMessage: error
  });
}


exports.getDeactivate = (req, res) => {
  let success = search(req.session.flash, 'success'), error = search(req.session.flash, 'error');
  req.session.flash = [];
  
  res.render('supplier/deactivate', {
    id: req.params.id,
    successMessage: success,
    errorMessage: error
  });
}

exports.getResendToken = (req, res) => {
  let success = search(req.session.flash, 'success'), error = search(req.session.flash, 'error');
  req.session.flash = [];
  
  res.render("supplier/resend", {
    successMessage: success,
    errorMessage: error
  });
}


exports.postDelete = function (req, res, next) {  
  let id = req.body.id;
  supplierDelete(req, res, id);
}


exports.postDeactivate = function (req, res, next) {  
  let id = req.body.id;
  try {
    //Delete Supplier's Capabilities first:
    MongoClient.connect(URL, {useUnifiedTopology: true}, async function(err, db) {
      if(treatError(req, res, err, 'back'))
        return false;
      let dbo = db.db(BASE);
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
  //let errors = req.validationErrors();
  //if (errors) return res.status(400).send(errors);  
  
  let token = await getObjectMongoose('UserToken', { token: req.params.token, userType: TYPE });  

  if(!token) {
    req.flash(
      'error', "We were unable to find a valid token. It may have expired. Please request a new confirmation token."
    );

    return res.redirect("/supplier/resend");
    }  
  
  const user = await getObjectMongoose('Supplier', { _id: token._userId, emailAddress: req.body.emailAddress });
  
  if(!user) 
    return res.status(400).send({
    msg: 'We were unable to find a user for this token.' 
  });

  if(user.isVerified) 
    return res.status(400).send({ 
    type: 'already-verified', 
    msg: 'This user has already been verified.' });

  await MongoClient.connect(URL, {useUnifiedTopology: true}, async function(err, db) {//db or client.
    if(treatError(req, res, err, 'back'))
      return false;
    let dbo = db.db(BASE);

    await dbo.collection("suppliers").updateOne({ _id: user._id }, { $set: { isVerified: true, isActive: true } }, function(err, resp) {
          if(err) {
            res.status(500).send(err.message);
          }
    });

    console.log("The account has been verified. Please log in.");
    req.flash('success', "The account has been verified. Please log in.");        
    db.close();
    res.redirect('/supervisor/sign-in');
    //res.status(200).send("The account has been verified. Please log in.");          
  });
}


exports.postResendToken = async function(req, res, next) {
  const user = await getObjectMongoose('Supplier', { emailAddress: req.body.emailAddress });
  
  if (!user)
    return res
      .status(400)
      .send({ msg: "We were unable to find a user with that email." });
  if (user.isVerified)
    return res.status(400).send({
      msg: "This account has already been verified. Please log in."
    });

  let token = new UserToken({
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
}


exports.getSignIn = (req, res) => {
  if (!req.session.supplierId || !req.session.supplier.isVerified) {
    let success = search(req.session.flash, 'success'), error = search(req.session.flash, 'error');
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


exports.getSignUp = async (req, res) => {
  if(!req.session.supplierId) {
    let countries = await getDataMongoose('Country');
    let industries = await getDataMongoose('Industry');
    let capabilities = await getDataMongoose('Capability');
   
    let success = search(req.session.flash, 'success'), error = search(req.session.flash, 'error');
    req.session.flash = [];

    countries.sort(function (a, b) {
      return a.name.localeCompare(b.name);
    });

    industries.sort(function (a, b) {
      return a.name.localeCompare(b.name);
    });

    capabilities.sort(function (a, b) {
      return a.name.localeCompare(b.name);
    });

    return res.render("supplier/sign-up", {
      MAX_PROD: process.env.SUPP_MAX_PROD,
      DEFAULT_CURR: process.env.SUPP_DEFAULT_CURR,
      FILE_UPLOAD_MAX_SIZE: process.env.FILE_UPLOAD_MAX_SIZE,
      encryptionNotice: encryptionNotice,
      countries: countries,
      industries: industries,
      capabilities: capabilities,
      captchaSiteKey: captchaSiteKey,
      successMessage: success,
      errorMessage: error
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
      let prohibitedArray = ["gmaid.com", "hotmaix.com", "outloop.com", "yandex.com", "yahuo.com", "gmx"];

      for (let i = 0; i < prohibitedArray.length; i++)
        if (final_domain.toLowerCase().includes(prohibitedArray[i].toLowerCase())) {
          req.flash("error", "E-mail address must belong to a custom company domain.");
          return res.redirect("/supplier/sign-up"); //supplier/sign-up
          
        } else {
          if (req.body.password.length < 6) {
            req.flash("error", "Password must have at least 6 characters.");
            return res.redirect("/supplier/sign-up");
            let supplier;
            
            //Prevent duplicate attempts:
          } else if (global++ < 1) {            
            const user = await getObjectMongoose('Supplier', { emailAddress: req.body.emailAddress });           
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
            }).catch(console.error);

            let supplier;
            let hash = bcrypt.hashSync(req.body.password, 10);
            console.log(req.body.currenciesList);
            
            try {
              let productList = prel(req.body.productsServicesOffered);
              let amountsList = prel(req.body.amountsList, false, true);
              let pricesList = prel(req.body.pricesList, true, false);
              let imagesList = prel(req.body.productImagesList);
              let currenciesList = prel(req.body.currenciesList);
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
                facebookURL: req.body.facebookURL,
                instagramURL: req.body.instagramURL,
                twitterURL: req.body.twitterURL,
                linkedinURL: req.body.linkedinURL,
                otherSocialMediaURL: req.body.otherSocialMediaURL,
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
                  let capability = new Capability({
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

                let token = new UserToken({
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
                      let industry = new Industry({
                        name: req.body.industry
                      });

                      industry.save((err) => {
                        if(treatError(req, res, err, '/supplier/sign-up'))
                          return false;//If that industry already exists.
                      });
                    }

                    await sendConfirmationEmail(supplier.companyName, "/supplier/confirmation/", token.token, req);

                    if (Array.isArray(supplier.productsServicesOffered)) {
                      for (let i in supplier.productsServicesOffered) {
                        console.log(supplier.currenciesList[i]);
                        
                        let productService = new ProductService({
                          supplier: supplier._id,
                          productName: supplier.productsServicesOffered[i],
                          price: parseFloat(supplier.pricesList[i]).toFixed(2),
                          currency: supplier.currency,//supplier.currenciesList[i],
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
  let success = search(req.session.flash, 'success'), error = search(req.session.flash, 'error');
  req.session.flash = [];
  
  res.render("supplier/forgotPassword", {
    email: req.session.supplier.emailAddress,
    successMessage: success,
    errorMessage: error
  });
}


exports.getChatLogin = (req, res) => {//We need a username, a room name, and a socket-based ID.
  let success = search(req.session.flash, 'success'), error = search(req.session.flash, 'error');
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


exports.getChat = async (req, res) => {//Coming from the getLogin above.
  let success = search(req.session.flash, 'success'), error = search(req.session.flash, 'error');
  req.session.flash = [];
  let messages = await getDataMongoose('Message', {
      $or: [
        { from: req.params.from, to: req.params.to },
        { from: req.params.to, to: req.params.from }
      ]
    });
  
  console.log(messages.length);

  //messages.sort(compareTimes);
  messages.sort((a, b) => (a.time > b.time ? 1 : b.time > a.time ? -1 : 0));
  
  res.render("supplier/chat", {
    successMessage: success,
    errorMessage: error,
    messages: messages,
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
          let token = buf.toString("hex");
          done(err, token);
        });
      },
      async function(token, done) {
        const user = await getObjectMongoose('Supplier', { emailAddress: req.body.emailAddress });       
        if (!user) {
          req.flash('error', 'Sorry. We were unable to find a user with this e-mail address.');
          return res.redirect('supplier/forgotPassword');
        }

        MongoClient.connect(URL, {useUnifiedTopology: true}, function(err, db) {
          if(treatError(req, res, err, 'back'))
            return false;

          let dbo = db.db(BASE);
          dbo.collection("suppliers").updateOne({ _id: user._id }, { $set: {resetPasswordToken: token, resetPasswordExpires: Date.now() + 86400000} }, function(err, resp) {        
            if(treatError(req, res, err, 'back'))
              return false;
            db.close();
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


exports.getResetPasswordToken = async (req, res) => {
  let success = search(req.session.flash, 'success'), error = search(req.session.flash, 'error');
  req.session.flash = [];
  
  const user = await getObjectMongoose('Supplier', {
      resetPasswordToken: req.params.token,
      resetPasswordExpires: { $gt: Date.now() }
    });
  
    if (!user) {
      req.flash("error", "Password reset token is either invalid or expired.");
      return res.redirect("supplier/forgotPassword");
    }
    res.render("supplier/resetPassword", { 
      token: req.params.token,
      successMessage: success,
      errorMessage: error
    });
};


exports.postResetPasswordToken = (req, res) => {
  async.waterfall([
    async function(done) {
      const user = await getObjectMongoose('Supplier', {resetPasswordToken: req.params.token, 
                     resetPasswordExpires: { $gt: Date.now() }
                    });
      if(!user) {
        req.flash('error', 'Password reset token is either invalid or expired.');
        return res.redirect('back');
      }
        
    if(req.body.password === req.body.passwordRepeat) {
        MongoClient.connect(URL, {useUnifiedTopology: true}, function(err, db) {
          if(treatError(req, res, err, 'back'))
            return false;
          let dbo = db.db(BASE);
          let hash = bcrypt.hashSync(req.body.password, 10);
          
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


exports.getProfile = async (req, res) => {
  if (!req || !req.session) 
    return false;
  
  console.log(req.connection.remoteAddress);    
  const supplier = req.session.supplier;
  let products = await getDataMongoose('ProductService', { supplier: supplier._id });
  let countries = await getDataMongoose('Country');
  let industries = await getDataMongoose('Industry');
  let capabilities = await getDataMongoose('Capability', { supplier: supplier._id });
 
  products.sort(function(a, b) {
    return a.productName.localeCompare(b.productName);
  });

  req.session.supplier.productsServicesOffered = [];

  for(let i in products) {
    req.session.supplier.productsServicesOffered.push(products[i].productName);
    if(!fileExists(products[i].productImage))
        products[i].productImage = '';
  }

  let success = search(req.session.flash, 'success'), error = search(req.session.flash, 'error');
  req.session.flash = [];

  countries.sort(function (a, b) {
    return a.name.localeCompare(b.name);
  });

  industries.sort(function (a, b) {
    return a.name.localeCompare(b.name);
  });

  capabilities.sort(function (a, b) {
    return a.name.localeCompare(b.name);
  });

  res.render("supplier/profile", {
    products: products,
    countries: countries,
    industries: industries,
    capabilities: capabilities,
    MAX_PROD: process.env.SUPP_MAX_PROD,
    DEFAULT_CURR: process.env.SUPP_DEFAULT_CURR,
    FILE_UPLOAD_MAX_SIZE: process.env.FILE_UPLOAD_MAX_SIZE,
    successMessage: success,
    errorMessage: error,
    profile: req.session.supplier         
  });
}


exports.getBidRequests = async (req, res) => {
  const supplier = req.session.supplier;
  try {
    initConversions(fx);
  } catch {
  }
  
  let requests = await getDataMongoose('BidRequest', { supplier: supplier._id });
  
  let validBids = [], cancelledBids = [], expiredBids = [];
  if(requests && requests.length) {
    for(let i in requests) {
      let date = Date.now();
      let bidDate = requests[i].expiryDate;
      bidDate > date? 
        (requests[i].isCancelled == true? cancelledBids.push(requests[i]) : validBids.push(requests[i]))
      : expiredBids.push(requests[i]);
      }
    }

    await sendExpiredBidEmails(req, res, expiredBids);    
    let totalPrice = 0, validPrice = 0, cancelledPrice = 0, expiredPrice = 0;
    
    for(let i in validBids) {
      //validPrice += fx(parseFloat(validBids[i].price)).from(validBids[i].currency).to(supplier.currency);
      validPrice += parseFloat(validBids[i].supplierPrice);
    }
    
    totalPrice = parseFloat(validPrice);
    
    for(let i in cancelledBids) {
      cancelledPrice += parseFloat(cancelledBids[i].supplierPrice);
    }
    
    totalPrice += parseFloat(cancelledPrice);
    
    for(let i in expiredBids) {
      expiredPrice += parseFloat(expiredBids[i].supplierPrice);
    }
    
    totalPrice += parseFloat(expiredPrice);
    let success = search(req.session.flash, 'success'), error = search(req.session.flash, 'error');
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
};


exports.getBalance = (req, res) => {
  res.render("supplier/balance", { 
    balance: req.session.supplier.balance,
    appId: process.env.EXCH_RATES_APP_ID,
    currency: req.session.supplier.currency
  });
}


exports.getBidRequest = async (req, res) => {  
  //const supplier = req.session.supplier;  
  const id = req.params.id;
  let success = search(req.session.flash, 'success'), error = search(req.session.flash, 'error');
  req.session.flash = [];  
  let request = await getObjectMongoose('BidRequest', { _id: id });
  let buyer = await getObjectMongoose('Buyer', { _id: request.buyer });
  
  for(let j in request.productDetailsList) {
    if(!fileExists(request.productDetailsList[j].productImage)) {      
      request.productDetailsList[j].productImage = '';
    }
  }

  if(request.expirationDate <= Date.now() + process.env.DAYS_BEFORE_BID_EXPIRES * process.env.DAY_DURATION) {
    request.warningExpiration = true;
    if(request.isExtended == true) {
      request.cannotExtendMore = true;
    }
  }
  
  let statuses = await renderBidStatuses();

  res.render("supplier/bid-request", {    
    bid: request,
    buyer: buyer,
    path: '../',
    bidExtensionDays: process.env.DAYS_BID_EXTENDED,
    successMessage: success,
    errorMessage: error,
    statuses: statuses,
    statusesJson: JSON.stringify(getBidStatusesJson())
    });
}


exports.postBidRequest = (req, res) => {
  updateBidBody(req, res, req.body.reqId, '/supplier/index');
 }


exports.postProfile = async (req, res) => {
  global = 0;
  const ipv4 = await internalIp.v4();
  
  try {
    let doc = await getObjectMongoose('Supplier', { _id: req.body._id });
    let productList = prel(req.body.productsServicesOffered);
    let amountsList = prel(req.body.amountsList, false, true);
    let pricesList = prel(req.body.pricesList, true, false);
    let imagesList = prel(req.body.productImagesList);
    let currenciesList = prel(req.body.currenciesList);
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
    doc.facebookURL = req.body.facebookURL;
    doc.instagramURL = req.body.instagramURL;
    doc.twitterURL = req.body.twitterURL;
    doc.linkedinURL = req.body.linkedinURL;
    doc.otherSocialMediaURL = req.body.otherSocialMediaURL;
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
    doc.UNITETermsAndConditions = true;
    doc.antibriberyAgreement = true;
    doc.createdAt = req.body.createdAt;
    doc.updatedAt = Date.now();
    doc.createdAtFormatted = normalFormat(req.body.createdAt);
    doc.updatedAtFormatted = normalFormat(Date.now());
    
    //doc.__v = 1;//Last saved version. To be taken into account for future cases of concurrential changes, in case updateOne does not protect us from that problem.
    let price = req.body.price;
    
    if(global++ < 1)
    await MongoClient.connect(URL, {useUnifiedTopology: true}, async function(err, db) {
      if(treatError(req, res, err, '/supplier/profile'))
        return false;
      
      let dbo = db.db(BASE);
      
      await dbo.collection("suppliers").updateOne({ _id: doc._id }, { $set: doc }, function(err, resp0) {
        if(treatError(req, res, err, '/supplier/profile'))
          return false;
      });

      console.log("Supplier updated!");
      let arr = doc.productsServicesOffered;
      
      if(req.body.saveCapability.length) {
        await dbo.collection("capabilities").deleteMany({ supplier: doc._id }, (err, resp1) => {
          if(treatError(req, res, err, '/supplier/profile'))
            return false;

        
            let capability = new Capability({
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
        let industry = new Industry({
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
        for (let i in arr) {
          if(!doc.pricesList[i]) 
            continue;

          let productService = new ProductService({
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
    //.catch(console.error);
  } catch {
    //return res.redirect("/supplier/profile");
  }
};