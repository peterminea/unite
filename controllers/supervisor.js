const crypto = require('crypto');
const bcrypt = require("bcryptjs");
const ObjectId = require("mongodb").ObjectId;
const Supervisor = require("../models/supervisor");
const Buyer = require("../models/buyer");
const BidRequest = require("../models/bidRequest");
const UserToken = require("../models/userToken");
const assert = require('assert');
const process = require('process');
const { basicFormat, customFormat, normalFormat } = require("../middleware/dateConversions");
const async = require('async');
const MongoClient = require('mongodb').MongoClient;
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
const Country = require('../models/country');
const internalIp = require('internal-ip');
const { verifyBanNewUser, verifyBanExistingUser } = require('../middleware/verifyBanned');
const TYPE = process.env.USER_SPV;

function getBidsData(bids) {
  let validBids = 0, validBidsPrice = 0;
  let cancelledBids = 0, cancelledBidsPrice = 0;
  let expiredBids = 0, expiredBidsPrice = 0;
  let obj = {};
  
  if(bids && bids.length) {
    obj.totalBids = bids.length;
    
    for(let i in bids) {
      if(!bids[i].isCancelled && !bids[i].isExpired) {
        validBids++;
        validBidsPrice += parseFloat(bids[i].buyerPrice).toFixed(2);
      }
      
      if(bids[i].isCancelled) {
        cancelledBids++;
        cancelledBidsPrice += parseFloat(bids[i].buyerPrice).toFixed(2);
      }
      
      if(bids[i].isExpired) {
        expiredBids++;
        expiredBidsPrice += parseFloat(bids[i].buyerPrice).toFixed(2);
      }        
    }
  } else {
    obj.totalBids = 0;
  }
  
  obj.validBids = validBids;
  obj.validBidsPrice = validBidsPrice;
  obj.cancelledBids = cancelledBids;
  obj.cancelledBidsPrice = cancelledBidsPrice;
  obj.expiredBids = expiredBids;
  obj.expiredBidsPrice = expiredBidsPrice;
  obj.totalPrice = validBidsPrice + cancelledBidsPrice + expiredBidsPrice;
  
  return obj;
}


async function getBuyerBidsData(req, res, buyers) {
  let bidData = [];
  
  if(buyers && buyers.length) {
    for(let i in buyers) {
      let bids = await getDataMongoose('BidRequest', { buyer: new ObjectId(buyers[i]._id) });
      let obj = getBidsData(bids);
      bidData.push(obj);      
    }
  }
  
  return bidData;
}


exports.getIndex = async (req, res) => {
  if(!req || !req.session) 
    return false;
  
  const supervisor = req.session.supervisor;
  let results = await getDataMongoose('Buyer', { organizationUniteID: supervisor.organizationUniteID });
  let bidData = await getBuyerBidsData(req, res, results);
  console.log(bidData? bidData.length : 'Null');
  
  if(bidData.length)
  for(let i in results) {
    results[i].bidData = bidData[i];
  }

  let success = search(req.session.flash, 'success'), error = search(req.session.flash, 'error');
  req.session.flash = [];

  if(supervisor.avatar && supervisor.avatar.length && !fileExists('public/' + supervisor.avatar.substring(3))) {
    supervisor.avatar = '';
  }

  res.render("supervisor/index", {
    supervisor: supervisor,
    successMessage: success,
    errorMessage: error,
    buyers: results
  });
}


exports.getConfirmation = (req, res) => {
  if(!req.session || !req.session.supervisorId) {
    req.session = req.session? req.session : {};
    req.session.supervisorId = req.params && req.params.token? req.params.token._userId : null;
  }
  
  let success = search(req.session.flash, 'success'), error = search(req.session.flash, 'error');
  req.session.flash = [];
  
  res.render('supervisor/confirmation', {
    token: req.params? req.params.token : null,
    successMessage: success,
    errorMessage: error
  });
}


exports.getDeactivate = (req, res) => {
  let success = search(req.session.flash, 'success'), error = search(req.session.flash, 'error');
  req.session.flash = [];
  
  res.render('supervisor/deactivate', {
    id: req.params.id, 
    uniteId: req.params.organizationUniteID,
    successMessage: success,
    errorMessage: error
  });
}


exports.getDelete = async (req, res) => {
  let success = search(req.session.flash, 'success'), error = search(req.session.flash, 'error');
  req.session.flash = [];
  let titles = await getCancelReasonTitles(process.env.USER_CANCEL_TYPE, false, false);
  
  res.render('supervisor/delete', {
    id: req.params.id, 
    titles: titles,
    organizationUniteID: req.params.organizationUniteID,
    successMessage: success,
    errorMessage: error
  });
}


exports.getDeleteBuyer = async (req, res) => {
  let success = search(req.session.flash, 'success'), error = search(req.session.flash, 'error');
  req.session.flash = [];
  let titles = await getCancelReasonTitles(process.env.USER_CANCEL_TYPE, false, true);
  
  res.render('supervisor/deleteBuyer', {
    id: req.params.id, 
    titles: titles,
    organizationUniteID: req.params.organizationUniteID,
    successMessage: success,
    errorMessage: error
  });
}


exports.postDeleteBuyer = async function(req, res, next) {  
  buyerDelete(req, res, req.body.id, false, true);
};


exports.getResendToken = (req, res) => {
  let success = search(req.session.flash, 'success'), error = search(req.session.flash, 'error');
  req.session.flash = [];
  
  res.render('supervisor/resend', {
    successMessage: success,
    errorMessage: error
  });
}


exports.getChatLogin = (req, res) => {//We need a username, a room name, and a socket-based ID.
  let success = search(req.session.flash, 'success'), error = search(req.session.flash, 'error');
  req.session.flash = [];
  
  res.render("supervisor/chatLogin", {
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
  let success = search(req.session.flash, 'success'), error = search(req.session.flash, 'error');
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


exports.postDeactivate = async (req, res) => {
  let id = req.body.id, uniteId = req.body.uniteID;
  const buyers = await getDataMongoose('Buyer', {organizationUniteID: uniteId, isActive: true});
  
  if(buyers && buyers.length) {
    req.flash('error', 'You have at least one active Buyer associated to your Supervisor account. It is not advisable to deactivate your account at this time.');
    return res.redirect('/supervisor/profile');
  }

  try {
    MongoClient.connect(URL, {useUnifiedTopology: true}, async function(err, db) {
      if(treatError(req, res, err, 'back'))
        return false;
      let dbo = db.db(BASE);
      //And now, deactivate the Supplier themselves:
      await dbo.collection('supervisors').updateOne( { _id: id }, { $set: { isActive: false } }, function(err, resp) {
        if(treatError(req, res, err, 'back'))
          return false;
        req.flash('success', 'Supervisor successfully deactivated. You will re-become active at your next login.');
        return res.redirect('/supervisor/sign-in');
      });        
    });
  } catch {
    }  
};


exports.postDelete = function (req, res, next) {
  supervisorDelete(req, res, req.body.id, req.body.organizationUniteID);
}


exports.postConfirmation = async function (req, res, next) {
  try {
    
    let token = await getObjectMongoose('UserToken', { token: req.params.token, userType: TYPE });
    let user = await getObjectMongoose('Supervisor', { _id: token._userId, emailAddress: req.body.emailAddress });

    if (!token) {
      req.flash('error', 'We were unable to find a valid token. It may have expired. Please request a new token.');
      return res.redirect('/supervisor/resend');
    }

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
        let dbo = db.db(BASE);

        await dbo.collection("supervisors").updateOne({ _id: user._id }, { $set: {isVerified: true} }, function(err, resp) {
          if(err) {
            req.flash('error', err.message);
            console.error(err.message);
            return res.status(500).send({ 
              msg: err.message 
            });

          }

        db.close();
        console.log("The account has been verified. Please log in.");
        req.flash('success', "The account has been verified. Please log in.");
        return res.redirect('/supervisor/sign-in');
            });       
    });
  } catch {
    //req.flash('error', 'Error on Verification!');
    //return res.redirect('/supervisor/sign-in');
  }
}


exports.postResendToken = async function (req, res, next) {
  const user = await getObjectMongoose('Supervisor', { emailAddress: req.body.emailAddress });
  
  if (!user) 
    return res.status(400).send({ msg: 'We were unable to find a user with that email.' });
  if (user.isVerified) 
    return res.status(400).send({ msg: 'This account has already been verified. Please log in.' });

  let token = new UserToken({ 
    _userId: user._id, 
    userType: TYPE,
    token: crypto.randomBytes(16).toString('hex') });

  await token.save((err) => {
      if (err) {
        return res.status(500).send({
          msg: err.message 
        });
      } 
  });

  await resendTokenEmail(user, token.token, '/supervisor/confirmation/', req);
  return res.status(200).send('A verification email has been sent to ' + user.emailAddress + '.');
}


exports.getForgotPassword = (req, res) => {
  let success = search(req.session.flash, 'success'), error = search(req.session.flash, 'error');
  req.session.flash = [];
  
  res.render("supervisor/forgotPassword", {
    successMessage: success,
    errorMessage: error,
    email: req.session.supervisor.emailAddress//We pre-fill the e-mail field with the address.
  });
}


exports.postForgotPassword = (req, res, next) => {
  async.waterfall([
    function(done) {
      crypto.randomBytes(20, function(err, buf) {
        let token = buf.toString('hex');
        done(err, token);
      });
    },
    async function(token, done) {
      const user = await getObjectMongoose('Supervisor', { emailAddress: req.body.emailAddress });
     
      if (!user) {
        req.flash('error', 'Sorry. We were unable to find a user with this e-mail address.');
        return res.redirect('supervisor/forgotPassword');
      }

      MongoClient.connect(URL, {useUnifiedTopology: true}, function(err, db) {
        if(treatError(req, res, err, 'back'))
          return false;

        let dbo = db.db(BASE);
        dbo.collection("supervisors").updateOne({ _id: user._id }, { $set: {resetPasswordToken: token, resetPasswordExpires: Date.now() + 86400000} }, function(err, res) {        
          if(treatError(req, res, err, 'back'))
            return false;
          db.close();
        });
      });
    },
    function(token, user, done) {
      sendForgotPasswordEmail(user, 'Supervisor', "/supervisor/reset/", token, req);
    }
  ], function(err) {
    if(treatError(req, res, err, '/supervisor/forgotPassword'))
      return false;
    return res.redirect('/supervisor');
  });
}


exports.getResetPasswordToken = async (req, res) => {
  let success = search(req.session.flash, 'success'), error = search(req.session.flash, 'error');
  req.session.flash = [];
  const user = await getObjectMongoose('Supervisor', {resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() }});
  
  if(!user) {
    req.flash('error', 'Password reset token is either invalid or expired.');
    return res.redirect('/supervisor/forgotPassword');
  }
  
  res.render('supervisor/resetPassword', {
    token: req.params.token,
    successMessage: success,
    errorMessage: error
  });  
}


exports.postResetPasswordToken = (req, res) => {
  async.waterfall([
    async function(done) {
      const user = await getObjectMongoose('Supervisor', {resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() }});

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
          dbo.collection("supervisors").updateOne({ _id: user._id }, 
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
      sendResetPasswordEmail(user, 'Supervisor', req);
    }
  ], function(err) {
      if(treatError(req, res, err, '/supervisor'))
        return false;
      return res.redirect('/supervisor');
    });
}


exports.getSignIn = (req, res) => {
  let success = search(req.session.flash, 'success'), error = search(req.session.flash, 'error');
  req.session.flash = [];
  
  if (!req.session.supervisorId || !req.session.supervisor.isVerified)
    res.render("supervisor/sign-in", {
      captchaSiteKey: captchaSiteKey,
      successMessage: success,
      errorMessage: error
    });
  else 
    return res.redirect("/supervisor");
}


exports.getSignUp = async (req, res) => {
  if(!req.session.supervisorId) {    
    const countries = await getDataMongoose('Country');
    let success = search(req.session.flash, 'success'), error = search(req.session.flash, 'error');
    req.session.flash = [];

    res.render("supervisor/sign-up", {
      captchaSiteKey: captchaSiteKey,
      countries: countries,
      FILE_UPLOAD_MAX_SIZE: process.env.FILE_UPLOAD_MAX_SIZE,
      encryptionNotice: encryptionNotice,
      successMessage: success,
      errorMessage: error
      });
    } else 
      return res.redirect("/supervisor");
}


exports.postSignIn = (req, res) => {
  postSignInBody('supervisor', req, res);
}


let global = 0;
exports.postSignUp = async (req, res) => {
  const captchaVerified = await fetch('https://www.google.com/recaptcha/api/siteverify?secret=' + captchaSecretKey + '&response=' + req.body.captchaResponse, {method: 'POST'})
  .then((res0) => res0.json());  
  
  console.log(captchaVerified);
  if(((req.body.captchaResponse).length == 0) || captchaVerified.success === true) {
    if(req.body.emailAddress) {
      const email = req.body.emailAddress;
      const email_str_arr = email.split("@");
      const domain_str_location = email_str_arr.length - 1;
      const final_domain = email_str_arr[domain_str_location];
      let prohibitedArray = ["gmaid.com", "hotmaix.com", "outloop.com", "yandex.com", "yahuo.com", "gmx"];

      for(let i = 0; i < prohibitedArray.length; i++)
      if (final_domain.toLowerCase().includes(prohibitedArray[i].toLowerCase())) {
        req.flash("error", "E-mail address must be a custom company domain.");
        return res.redirect("/supervisor/sign-up");
        
      } else {
        if (req.body.password.length < 6 || req.body.password.length > 16) {
          req.flash("error", "Password must have between 6 and 16 characters.");
          return res.redirect("/supervisor/sign-up");
          
          } else if(global++ < 1) {
            const user = await getObjectMongoose('Supervisor', { emailAddress: req.body.emailAddress });            
            if(treatError(req, res, err, '/supplier/sign-up'))
              return false;

            const ipv4 = await internalIp.v4();

            if(verifyBanNewUser(req, res, req.body.emailAddress, ipv4)) {
              return res.status(400).send({
                msg: 'You are trying to join UNITE from the part of an already banned user. Please refrain from doing so.'
              });
            }

            if (user) 
              return res.status(400).send({ msg: 'The e-mail address you have entered is already associated with another account.'});
              let supervisor;
              let hash = bcrypt.hashSync(req.body.password, 10);

              try {
                //user = new Promise((resolve, reject) => {
                  supervisor = new Supervisor({
                    role: process.env.USER_REGULAR,
                    avatar: req.body.avatar,
                    organizationName: req.body.organizationName,
                    organizationUniteID: req.body.organizationUniteID,
                    contactName: req.body.contactName,
                    emailAddress: req.body.emailAddress,
                    password: hash,
                    ipv4: ipv4,
                    isVerified: false,
                    isActive: false,
                    contactMobileNumber: req.body.contactMobileNumber,
                    address: req.body.address,
                    country: req.body.country,
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
                    UNITETermsAndConditions: true,
                    antibriberyAgreement: true,
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                    createdAtFormatted: normalFormat(Date.now()),
                    updatedAtFormatted: normalFormat(Date.now())
                  });

                  await supervisor.save((err) => {
                    if(treatError(req, res, err, '/supervisor/sign-up'))
                      return false;

                    req.session.supervisor = supervisor;
                    req.session.supervisorId = supervisor._id;
                    req.session.save();

                    let token = new UserToken({ 
                      _userId: supervisor._id,
                      userType: TYPE, 
                      token: crypto.randomBytes(16).toString('hex') });

                    token.save(async function (err) {
                      if (err) {
                        req.flash('error', err.message);
                        console.error(err.message);
                        return res.status(500).send({
                          msg: err.message 
                        });
                      }

                      await sendConfirmationEmail(supervisor.organizationName, "/supervisor/confirmation/", token.token, req);
                      req.flash("success", "Supervisor signed up successfully! Please confirm your account by visiting " + req.body.emailAddress + '');
                      setTimeout(function() {
                        return res.redirect("/supervisor/sign-in");
                }, 250);
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


exports.getProfile = async (req, res) => {
  if (!req || !req.session) 
    return false;
 
  const countries = await getDataMongoose('Country');
  let success = search(req.session.flash, 'success'), error = search(req.session.flash, 'error');
  req.session.flash = [];

  res.render("supervisor/profile", {
    successMessage: success,
    errorMessage: error,
    FILE_UPLOAD_MAX_SIZE: process.env.FILE_UPLOAD_MAX_SIZE,
    countries: countries,
    profile: req.session.supervisor
  });
}


exports.postProfile = async (req, res) => {
  try {
    let doc = await getObjectMongoose('Supervisor', { _id: req.body._id });
    const ipv4 = await internalIp.v4();
    
    doc._id = req.body._id;
    doc.avatar = req.body.avatar;
    doc.role = req.body.role;
    doc.organizationName = req.body.organizationName;
    doc.organizationUniteID = req.body.organizationUniteID;
    doc.contactName = req.body.contactName;
    doc.emailAddress = req.body.emailAddress;
    doc.password = req.body.password;
    doc.isVerified = true;
    doc.isActive = true;
    doc.ipv4 = ipv4;
    doc.contactMobileNumber = req.body.contactMobileNumber;
    doc.address = req.body.address;
    doc.country = req.body.country;
    doc.certificates = req.body.certificatesIds;
    doc.antibriberyPolicy = req.body.antibriberyPolicyId;
    doc.environmentPolicy = req.body.environmentPolicyId;
    doc.qualityManagementPolicy = req.body.qualityManagementPolicyId;
    doc.occupationalSafetyAndHealthPolicy = req.body.occupationalSafetyAndHealthPolicyId;
    doc.otherRelevantFiles = req.body.otherRelevantFilesId;
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

    MongoClient.connect(URL, {useUnifiedTopology: true}, function(err, db) {//db or client.
      if(treatError(req, res, err, '/supervisor/profile'))
        return false;
      
      let dbo = db.db(BASE);
      dbo.collection("supervisors").updateOne({ _id: doc._id }, { $set: doc }, function(err, resp) {
        if(treatError(req, res, err, '/supervisor/profile'))
          return false;
        
        req.session.supervisor = doc;
        req.session.supervisorId = doc._id;
        req.session.save((err) => {
          if(treatError(req, res, err, '/supervisor/profile'))
            return false;
          });

        db.close();
        req.flash("success", "Supervisor details updated successfully!");
        console.log("Supervisor details updated successfully!");

        setTimeout(function() {
          return res.redirect("/supervisor/profile");
        }, 400);
      });   
  })
    .catch(console.error);
  } catch {
    //return res.redirect('/supervisor/profile');
  }
}