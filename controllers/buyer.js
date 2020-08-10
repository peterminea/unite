const crypto = require("crypto");
const express = require("express");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const UserToken = require("../models/userToken");
const process = require("process");
const Schema = mongoose.Schema;
const Message = require("../models/message");
const Buyer = require("../models/buyer");
const Supervisor = require("../models/supervisor");
const Supplier = require("../models/supplier");
const Capability = require("../models/capability");
const BidRequest = require("../models/bidRequest");
const ProductService = require("../models/productService");
const Country = require('../models/country');
const BidStatus = require("../models/bidStatus");

const {
  basicFormat,
  customFormat,
  normalFormat
} = require("../middleware/dateConversions");
const async = require("async");
const MongoClient = require("mongodb").MongoClient;
const ObjectId = require("mongodb").ObjectId;
const URL = process.env.MONGODB_URI,
  BASE = process.env.BASE;
const treatError = require("../middleware/treatError");
const search = require("../middleware/searchFlash");
let Recaptcha = require("express-recaptcha").RecaptchaV2;

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
  getBidStatusesJson,
  renderBidStatuses,
  postSignInBody,
  saveBidBody,
  getCatalogItems,
  getPlaceBidBody,
  updateBidBody,
  getCurrenciesList,
  encryptionNotice,
  getCancelReasonTitles
} = require("../middleware/templates");

const { getObjectMongo, getDataMongo, getObjectMongoose, getDataMongoose } = require("../middleware/getData");

const {
  removeAssociatedBuyerBids,
  removeAssociatedSuppBids,
  buyerDelete,
  supervisorDelete,
  supplierDelete
} = require("../middleware/deletion");

const captchaSiteKey = process.env.RECAPTCHA_V2_SITE_KEY;
const captchaSecretKey = process.env.RECAPTCHA_V2_SECRET_KEY;
const fetch = require("node-fetch");
const internalIp = require('internal-ip');
const { verifyBanNewUser, verifyBanExistingUser } = require('../middleware/verifyBanned');
let fx = require("money"), initConversions = require("../middleware/exchangeRates");
const TYPE = process.env.USER_BUYER;

const buyerMenuTranslationKeys = [
  "translation.menu.languages",
  "translation.menu.home",
  "translation.menu.userDashboard",
  "translation.menu.userBalance",
  "translation.menu.userProfile",
  "translation.menu.logout"
];

exports.getIndex = async (req, res) => {
  if(!req.session || !req.session.buyer) {
    return;
  }
  
  try {
   await initConversions(fx);
  }
  catch {
  }

  let bids = await getDataMongoose('BidRequest', {buyer: req.session.buyer._id});
  let caps = await getDataMongoose('Capability');  
  let success = search(req.session.flash, "success"), error = search(req.session.flash, "error");
  req.session.flash = [];
  let buyer = req.session.buyer, cap = [], totalBidsPrice = 0;

  caps.sort(function (a, b) {
    return a.capabilityDescription.localeCompare(b.capabilityDescription);
  });
  
  if (bids && bids.length && fx) {
    for (let i in bids) {
      totalBidsPrice += fx(parseFloat(bids[i].buyerPrice).toFixed(2))
        .from(bids[i].supplierCurrency)
        .to(process.env.BID_DEFAULT_CURR);          
    }
  }

  if(buyer.avatar && buyer.avatar.length && !fileExists('public/' + buyer.avatar.substring(3))) {
    buyer.avatar = '';
  }

  res.render("buyer/index", {
    buyer: buyer,
    keys: buyerMenuTranslationKeys,
    MAX_PROD: process.env.BID_MAX_PROD,
    BID_DEFAULT_CURR: process.env.BID_DEFAULT_CURR,
    bidsLength: bids && bids.length ? bids.length : null,
    totalBidsPrice: totalBidsPrice,
    FILE_UPLOAD_MAX_SIZE: process.env.FILE_UPLOAD_MAX_SIZE,
    capabilities: caps,
    statuses: null,
    successMessage: success,
    errorMessage: error,
    suppliers: null
  });
};


//Buyers should load a Catalog of Products by clicking on a button in their Index page:
exports.getProductsCatalog = async (req, res) => {
  let catalogItems = await getCatalogItems();
  let success = search(req.session.flash, "success"), error = search(req.session.flash, "error");
  req.session.flash = [];

  res.render("buyer/productsCatalog", {
    data: (catalogItems),
    MAX: process.env.BID_MAX_PROD,
    keys: buyerMenuTranslationKeys,
    buyerId: req.session.buyer._id,
    successMessage: success,
    errorMessage: error
  });
}


exports.postIndex = async (req, res) => {
   initConversions(fx);

  if (req.body.capabilityInput) {//Initial search.
    //req.term for Autocomplete - We started the search and become able to place a Bid Request.
    const key = req.body.capabilityInput;
    let suppliers = await getDataMongoose('Supplier');
    let statuses = await getDataMongoose('BidStatus');
    let bids = await getDataMongoose('BidRequest', { buyer: req.session.buyer ? req.session.buyer._id : null });
    
    if(!suppliers.length || !statuses.length || !bids.length) {
      return false;
    }

    const suppliers2 = [];
    for(const supplier of suppliers) {
      if(supplier.capabilityDescription
          .toLowerCase()
          .includes(key.toLowerCase())) {
        suppliers2.push(supplier);
      }
    }

    let totalBidsPrice = 0;

    for (let i in bids) {
      totalBidsPrice += fx(parseFloat(bids[i].buyerPrice).toFixed(2))
        .from(bids[i].supplierCurrency)
        .to(process.env.BID_DEFAULT_CURR);
    }              

    let success = search(req.session.flash, "success"), error = search(req.session.flash, "error");
    req.session.flash = [];

    res.render("buyer/index", {
      buyer: req.session.buyer,
      suppliers: suppliers2,
      allSuppliers: suppliers,
      keys: buyerMenuTranslationKeys,
      MAX_PROD: process.env.BID_MAX_PROD,
      MAX_AMOUNT: process.env.MAX_PROD_PIECES,
      BID_DEFAULT_CURR: process.env.BID_DEFAULT_CURR,
      FILE_UPLOAD_MAX_SIZE: process.env.FILE_UPLOAD_MAX_SIZE,
      bidsLength: bids && bids.length ? bids.length : null,
      totalBidsPrice: totalBidsPrice,
      statuses: statuses,
      successMessage: success,
      errorMessage: error,
      statusesJson: JSON.stringify(getBidStatusesJson())
    });
  } else if(req.body.outsideCatalog) {//Open Bid - no products from the Catalog.  
    getPlaceBidBody(req, res);
  } else {
    res.redirect("/buyer");
  }
};


exports.getPlaceBid = async (req, res) => {
  getPlaceBidBody(req, res);
}


exports.postPlaceBid = async (req, res) => {  
  saveBidBody(req, res, '/');
}


exports.getBidsCatalog = async (req, res) => {
  let bids = await getDataMongoose('BidRequest', { buyer: new ObjectId(req.params.buyerId) });
  if(!bids.length) {
    req.flash('error', 'Error when retrieving Bids Catalog!');
    res.redirect('back');
  }
  
  bids.sort(function(a, b) {
    return a.requestName.localeCompare(b.requestName);
  });

  let success = search(req.session.flash, "success"), error = search(req.session.flash, "error");
  req.session.flash = [];

  res.render("buyer/bidsCatalog", {
    buyerName: req.params.buyerName,
    keys: buyerMenuTranslationKeys,
    successMessage: success,
    errorMessage: error,
    bids: bids
  });
};


exports.getChatLogin = (req, res) => {
  //We need a username, a room name, and a socket-based ID.
  let success = search(req.session.flash, "success"),
    error = search(req.session.flash, "error");
  req.session.flash = [];

  res.render("buyer/chatLogin", {
    successMessage: success,
    errorMessage: error,
    keys: buyerMenuTranslationKeys,
    from: req.params.supplierId,
    to: req.params.buyerId,
    fromName: req.params.supplierName,
    toName: req.params.buyerName,
    reqId: req.params.requestId ? req.params.requestId : 0,
    reqName: req.params.requestName ? req.params.requestName : "None"
  });
};


exports.getChat = async (req, res) => {
  //Coming from the getLogin above.
  let success = search(req.session.flash, "success"),
    error = search(req.session.flash, "error");
  req.session.flash = [];
  
  let messages = await getDataMongoose('Message', {
      $or: [
        { from: req.params.from, to: req.params.to },
        { from: req.params.to, to: req.params.from }
      ]
    });
  
  messages.sort((a, b) => (a.time > b.time ? 1 : b.time > a.time ? -1 : 0));

  res.render("supplier/chat", {
    successMessage: success,
    errorMessage: error,
    keys: buyerMenuTranslationKeys,
    messages: messages,
    user: process.env.USER_BUYER,
    from: req.params.from,
    to: req.params.to,
    username: req.params.username,
    room: req.params.room,
    fromName: req.params.fromName,
    toName: req.params.toName,
    reqId: req.params.reqId,
    reqName: req.params.reqName
  });
};


exports.getViewBids = async (req, res) => {  
  let result = [], data = await getDataMongoose('BidStatus');
 
  if(data && data.length && data.length > 0) {
    data.forEach((item) => {
      let obj = {
        id: item._id,
        value: item.value,
        name: item.value + " - " + item.name
      };

      result.push(obj);
    });
  }
  
  let bids = await getDataMongoose('BidRequest', {
    supplier: req.params.supplierId,
    buyer: req.params.buyerId
  });

  //Verify bids:
  let validBids = [],
    cancelledBids = [],
    expiredBids = [];
  if (bids && bids.length) {
    for (let i in bids) {
      let date = Date.now();
      let bidDate = bids[i].expiryDate;
      bidDate > date
        ? bids[i].isCancelled == true
          ? cancelledBids.push(bids[i])
          : validBids.push(bids[i])
        : expiredBids.push(bids[i]);
    }
  }

  await sendExpiredBidEmails(req, res, expiredBids);
  await initConversions(fx);
  let totalPrice = 0,
    validPrice = 0,
    cancelledPrice = 0,
    expiredPrice = 0;

  for (let i in validBids) {
    //validPrice += fx(parseFloat(validBids[i].price)).from(validBids[i].supplierCurrency).to(req.params.currency);
    if(validBids[i].expirationDate <= Date.now() + process.env.DAYS_BEFORE_BID_EXPIRES * process.env.DAY_DURATION) {
      validBids[i].warningExpiration = true;
      if(validBids[i].isExtended == true) {
        validBids[i].cannotExtendMore = true;
      }
    }
    
    validPrice += parseFloat(validBids[i].buyerPrice);
    
    for(let j in validBids[i].productDetailsList) {
      if(!fileExists(validBids[i].productDetailsList[j].productImage)) {      
        validBids[i].productDetailsList[j].productImage = '';
      }
    }
  }

  totalPrice = parseFloat(validPrice);

  for (let i in cancelledBids) {
    cancelledPrice += parseFloat(cancelledBids[i].buyerPrice);
  }

  totalPrice += parseFloat(cancelledPrice);

  for (let i in expiredBids) {
    expiredPrice += parseFloat(expiredBids[i].buyerPrice);
  }

  totalPrice += parseFloat(expiredPrice);

  let success = search(req.session.flash, "success"),
    error = search(req.session.flash, "error");
  req.session.flash = [];

  res.render("buyer/viewBids", {
    bids: validBids,
    cancelledBids: cancelledBids,
    expiredBids: expiredBids,
    totalBidLength: bids && bids.length ? bids.length : 0,
    buyerCancelBidStatus: process.env.BUYER_CANCEL_BID,
    keys: buyerMenuTranslationKeys,
    successMessage: success,
    errorMessage: error,
    totalPrice: totalPrice,
    validPrice: validPrice,
    expiredPrice: expiredPrice,
    cancelledPrice: cancelledPrice,
    currency: req.params.currency,
    path: '../../../../',
    supplierId: req.params.supplierId,
    buyerId: req.params.buyerId,
    balance: req.params.balance
  });
};


exports.postViewBids = (req, res) => {
  if(!(req.body.bidIdToDelete)) {    
  } else {//Delete
    MongoClient.connect(URL, { useUnifiedTopology: true }, function(err, db) {
      if(treatError(err, req, res, 'back'))
        return false;

      let dbo = db.db(BASE), myquery = { _id: req.body.bidIdToDelete };

      dbo.collection("bidrequests").deleteOne({ _id: req.body.bidIdToDelete }, function(err, resp) {
        if(treatError(err, req, resp, 'back')) {          
          db.close();
          return false;
        }
        
        req.flash('success', 'You cancelled this order.');
        db.close();
        res.redirect('back');
      });
    });
  }
};


exports.getViewBid = async (req, res) => {
  let success = search(req.session.flash, "success"),
    error = search(req.session.flash, "error");
  
  let bid = await getObjectMongoose('BidRequest', { _id: req.body.bidId });
  let statuses = await renderBidStatuses();
    
    res.render("buyer/viewBid", {
      bid: bid,
      path: '../',
      keys: buyerMenuTranslationKeys,
      bidExtensionDays: process.env.DAYS_BID_EXTENDED,
      stripePublicKey: process.env.STRIPE_KEY_PUBLIC,
      stripeSecretKey: process.env.STRIPE_KEY_SECRET,
      successMessage: success,
      errorMessage: error,
      statuses: statuses,
      statusesJson: JSON.stringify(getBidStatusesJson())
    });
}


exports.postViewBid = (req, res) => {
  updateBidBody(req, res, req.body.id, 'back');
}


exports.getCancelBid = async (req, res) => {
  let success = search(req.session.flash, "success"),
    error = search(req.session.flash, "error");
  req.session.flash = [];
  let titles = await getCancelReasonTitles(process.env.BID_CANCEL_TYPE, false, false);

  res.render("buyer/cancelBid", {
    successMessage: success,
    errorMessage: error,
    titles: titles,
    keys: buyerMenuTranslationKeys,
    bidId: req.params.bidId,
    bidName: req.params.bidName,
    userType: req.params.userType,
    buyerName: req.params.buyerName,
    supplierName: req.params.supplierName,
    buyerEmail: req.params.buyerEmail,
    supplierEmail: req.params.supplierEmail
  });
};


exports.postCancelBid = (req, res) => {
  try {
    MongoClient.connect(URL, { useUnifiedTopology: true }, async function(
      err,
      db
    ) {
      if (treatError(req, res, err, "back")) 
        return false;
      let dbo = db.db(BASE);

      try {
        await dbo.collection("cancelreasons").insertOne(
          {
            title: req.body.reasonTitle, //Radio!
            cancelType: process.env.BID_CANCEL_TYPE,
            userType: req.body.userType,
            reason: req.body.reason,
            userName: req.body.buyersName,
            createdAt: Date.now()
          },
          function(err, obj) {
            if (treatError(req, res, err, "back")) 
              return false;
          }
        );
      } catch (e) {
        if (treatError(req, res, e, "back")) 
          return false;
      } //Cancelled bids do not have an expiry date any longer:

      await dbo
        .collection("bidrequests")
        .updateOne(
          { _id: new ObjectId(req.body.bidId) },
          {
            $set: {
              isCancelled: true,
              expiryDate: null,
              expiryDateFormatted: null,
              status: parseInt(process.env.BUYER_BID_CANCEL)
            }
          },
          async function(err, resp) {
            if (treatError(req, res, err, "back")) 
              return false;
            await sendCancelBidEmail(
              req,
              req.body.suppliersName,
              req.body.buyersName,
              req.body.suppliersEmail,
              req.body.buyersEmail,
              "Supplier ",
              "Buyer ",
              req.body.reason
            );
            db.close();
            return res.redirect("back");
          }
        );
    });
  } catch {
    //return res.redirect('/buyer/index');
  }
};


exports.getConfirmation = (req, res) => {
  if (!req.session || !req.session.buyerId) {
    req.session = req.session ? req.session : {};
    req.session.buyerId =
      req.params && req.params.token ? req.params.token._userId : null;
  }

  let success = search(req.session.flash, "success"),
    error = search(req.session.flash, "error");
  req.session.flash = [];

  res.render("buyer/confirmation", {
    token: req.params ? req.params.token : null,
    keys: buyerMenuTranslationKeys,
    successMessage: success,
    errorMessage: error
  });
};


exports.getDelete = async (req, res) => {
  let success = search(req.session.flash, "success"),
    error = search(req.session.flash, "error");
  req.session.flash = [];
  let titles = await getCancelReasonTitles(process.env.USER_CANCEL_TYPE, false, false);

  res.render("buyer/delete", {
    id: req.params.id,
    titles: titles,
    keys: buyerMenuTranslationKeys,
    successMessage: success,
    errorMessage: error
  });
};


exports.getDeactivate = (req, res) => {
  let success = search(req.session.flash, "success"),
    error = search(req.session.flash, "error");
  req.session.flash = [];

  res.render("buyer/deactivate", {
    id: req.params.id,
    keys: buyerMenuTranslationKeys,
    successMessage: success,
    errorMessage: error
  });
};


exports.getResendToken = (req, res) => {
  let success = search(req.session.flash, "success"),
    error = search(req.session.flash, "error");
  req.session.flash = [];

  res.render("buyer/resend", {
    keys: buyerMenuTranslationKeys,
    successMessage: success,
    errorMessage: error
  });
};


exports.postDelete = async function(req, res, next) {  
  buyerDelete(req, res, req.body.id, false, false);
};


exports.postDeactivate = async function(req, res, next) {
  let id = req.body.id;
  try {
    //Firstly, a Reason why deactivating the account:
    MongoClient.connect(URL, { useUnifiedTopology: true }, async function(
      err,
      db
    ) {
      let dbo = db.db(BASE);

      //Delete Buyer's Bid Requests first:
      await removeAssociatedBuyerBids(req, dbo, id);

      //And now, remove the Buyer themselves:
      await dbo
        .collection("buyers")
        .updateOne({ _id: id }, { $set: { isActive: false } }, function(
          err,
          resp2
        ) {
          if (treatError(req, res, err, "back")) return false;
        });
      //Finally, send a mail to the ex-Buyer:
      await sendCancellationEmail(
        "Buyer",
        req,
        "placed orders",
        req.body.reason
      );
      db.close();
      req.flash(
        "success",
        "You have deactivated your Buyer account. Logging in will reactivate you."
      );
      return res.redirect("/buyer/sign-in");
    });
  } catch {}
};


exports.postConfirmation = async function(req, res, next) {
  try {
    let token = await getObjectMongoose('UserToken', { token: req.params.token, userType: TYPE });
  
    if (!token) {
      req.flash("We were unable to find a valid token. It may have expired. Please request a new token.");
      return res.redirect("/buyer/resend");       
    }
    
    let user = await getObjectMongoose('Buyer', { _id: token._userId, emailAddress: req.body.emailAddress });
    
    if(!user)
      return res.status(400).send({
        msg: "We were unable to find a user for this token."
      });

    if(user.isVerified)
      return res.status(400).send({
        type: "already-verified",
        msg: "This user has already been verified."
      });

    await MongoClient.connect(
      URL,
      { useUnifiedTopology: true },
      async function(err, db) {
        if (treatError(req, res, err, "back")) 
          return false;

        let dbo = db.db(BASE);
        await dbo
          .collection("buyers")
          .updateOne(
            { _id: user._id },
            { $set: { isVerified: true, isActive: true } },
            function(err, resp) {
              if (err) {
                console.error(err.message);
                return res.status(500).send({
                  msg: err.message
                });
              }
            }
          );

        db.close();
        console.log("The account has been verified. Please log in.");
        req.flash(
          "success",
          "The account has been verified. Please log in."
        );
        return res.redirect("/buyer/sign-in/");
        //res.status(200).send("The account has been verified. Please log in.");           
        }
      );    
  } catch {}
};


exports.postResendToken = async function(req, res, next) {
  /*
    req.assert('emailAddress', 'Email is not valid').isEmail();
    req.assert('emailAddress', 'Email cannot be blank').notEmpty();
    req.sanitize('emailAddress').normalizeEmail({ remove_dots: false });   
    let errors = req.validationErrors();
    if (errors) return res.status(400).send(errors);*/
  
  let user = await getObjectMongoose('Buyer', { emailAddress: req.body.emailAddress });  

  if (!user)
    return res
      .status(400)
      .send({ msg: "We were unable to find a user with that email." });

  if (user.isVerified)
    return res
      .status(400)
      .send({
        msg: "This account has already been verified. Please log in."
      });

  let token = new UserToken({
    _userId: user._id,
    userType: TYPE,
    token: crypto.randomBytes(16).toString("hex")
  });

  token.save(async function(err) {
    if (err) {
      req.flash("error", err.message);
      return res.status(500).send({
        msg: err.message
      });
    }

    await resendTokenEmail(user, token.token, "/buyer/confirmation/", req);
    return res
      .status(200)
      .send(
        "A verification email has been sent to " + user.emailAddress + "."
      );   
  });
};


exports.getSignIn = (req, res) => {
  let success = search(req.session.flash, "success"),
    error = search(req.session.flash, "error");
  req.session.flash = [];
  console.log('Success: ' + success);
  
  if (!req.session.buyerId || !req.session.buyer.isVerified) {
    return res.render("buyer/sign-in", {
      captchaSiteKey: captchaSiteKey,
      successMessage: success,
      errorMessage: error
    });
  }
  
 return res.redirect('/buyer');
};


exports.getSignUp = async (req, res) => {
  if(!req.session.buyerId) {
    let countries = await getDataMongoose('Country');
    let ids = await getDataMongoose('Supervisor', {}, {organizationUniteID: 1});
    let currencies = await getCurrenciesList();
    let success = search(req.session.flash, 'success'), error = search(req.session.flash, 'error');
    req.session.flash = [];

    let uniteIds = [];
    for(let i in ids) {
      uniteIds.push({
        id: i,
        name: ids[i].organizationUniteID
      });
    }

    uniteIds.sort(function (a, b) {
      return a.name.localeCompare(b.name);
    });

    return res.render("buyer/sign-up", {
      DEFAULT_CURR: process.env.BID_DEFAULT_CURR,
      captchaSiteKey: captchaSiteKey,
      FILE_UPLOAD_MAX_SIZE: process.env.FILE_UPLOAD_MAX_SIZE,
      currencies: currencies,
      uniteIds: uniteIds,
      encryptionNotice: (encryptionNotice),
      countries: countries,
      successMessage: success,
      errorMessage: error
    });
  }
  else return res.redirect("/buyer");
};


exports.getBalance = async (req, res) => {
  let currencies = await getCurrenciesList();
  
  res.render("buyer/balance", {
    balance: req.session.buyer.balance,
    currencies: currencies,
    keys: buyerMenuTranslationKeys,
    appId: process.env.EXCH_RATES_APP_ID,
    currency: req.session.buyer.currency
  });
};


exports.getForgotPassword = (req, res) => {
  let success = search(req.session.flash, "success"),
    error = search(req.session.flash, "error");
  req.session.flash = [];

  res.render("buyer/forgotPassword", {
    email: req.session.buyer.emailAddress,
    keys: buyerMenuTranslationKeys,
    successMessage: success,
    errorMessage: error
  });
};


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
        let user = await getObjectMongoose('Buyer', { emailAddress: req.body.emailAddress });
        
        if (!user) {
          req.flash(
            "error",
            "Sorry. We were unable to find a user with this e-mail address."
          );
          return res.redirect("buyer/forgotPassword");
        }

        MongoClient.connect(URL, { useUnifiedTopology: true }, function(err, db) {
          if (treatError(req, res, err, "back")) 
            return false;

          let dbo = db.db(BASE);
          dbo
            .collection("buyers")
            .updateOne(
              { _id: user._id },
              {
                $set: {
                  resetPasswordToken: token,
                  resetPasswordExpires: Date.now() + 86400000
                }
              },
              function(err, resp) {
                if (err) {
                  console.error(err.message);
                  req.flash("error", err.message);
                  return false;
                }

                db.close();
              });
          });        
      },
      function(token, user, done) {
        sendForgotPasswordEmail(user, "Buyer", "/buyer/reset/", token, req);
      }
    ],
    function(err) {
      if (treatError(req, res, err, "back")) 
        return false;
      return res.redirect("/buyer/forgotPassword");
    });
};


exports.getResetPasswordToken = async (req, res) => {
  let user = await getObjectMongoose('Buyer', {
    resetPasswordToken: req.params.token,
    resetPasswordExpires: { $gt: Date.now() }});

    if (!user) {
      req.flash(
        "error",
        "Password reset token is either invalid or expired."
      );
      return res.redirect("/forgotPassword");
    }

    let success = search(req.session.flash, "success"),
      error = search(req.session.flash, "error");
    req.session.flash = [];

    res.render("buyer/resetPassword", {
      token: req.params.token,
      keys: buyerMenuTranslationKeys,
      successMessage: success,
      errorMessage: error
    });   
};


exports.postResetPasswordToken = (req, res) => {
  async.waterfall(
    [
      async function(done) {
        let user = await getObjectMongoose('Buyer', {
            resetPasswordToken: req.params.token,
            resetPasswordExpires: { $gt: Date.now() }
          });
        
          if (!user) {
            req.flash(
              "error",
              "Password reset token is either invalid or expired."
            );
            return res.redirect("back");
          }

          if (req.body.password === req.body.passwordRepeat) {
            MongoClient.connect(URL, { useUnifiedTopology: true }, function(err, db) {
              if(treatError(req, res, err, "back")) 
                return false;

              let dbo = db.db(BASE);
              let hash = bcrypt.hashSync(req.body.password, 10);

              dbo
                .collection("buyers")
                .updateOne(
                  { _id: user._id },
                  {
                    $set: {
                      password: hash,
                      resetPasswordToken: undefined,
                      resetPasswordExpires: undefined
                    }
                  },
                  function(err, resp) {
                    if (treatError(req, res, err, "back")) return false;
                    db.close();
                  }
                );
            });
          } else {
            req.flash("error", "Passwords do not match.");
            return res.redirect("back");
          }       
      },
      function(user, done) {
        sendResetPasswordEmail(user, "Buyer", req);
      }
    ],
    function(err) {
      if (treatError(req, res, err, "back")) return false;
      return res.redirect("/buyer");
    }
  );
};


exports.postSignIn = (req, res) => {
  postSignInBody("buyer", req, res);
};


let global = 0;
function getSupers(id) {
  let promise = Supervisor.find({ organizationUniteID: id }).exec();
  return promise;
}


exports.postSignUp = async (req, res) => {
  const captchaVerified = await fetch(
    "https://www.google.com/recaptcha/api/siteverify?secret=" +
      captchaSecretKey +
      "&response=" +
      req.body.captchaResponse,
    { method: "POST" }
  ).then((res0) => res0.json());

  console.log(captchaVerified);
  
  if(
    req.body.captchaResponse.length == 0 ||
    captchaVerified.success === true
  ) {
    if(req.body.emailAddress) {
      const email = req.body.emailAddress;
      const email_str_arr = email.split("@");
      const domain_str_location = email_str_arr.length - 1;
      const final_domain = email_str_arr[domain_str_location];
      let prohibitedArray = [
        "gmaid.com",
        "hotmaix.com",
        "outloop.com",
        "yandex.com",
        "yahuo.com",
        "gmx"
      ];
      
      for (let i = 0; i < prohibitedArray.length; i++)
        if (
          final_domain.toLowerCase().includes(prohibitedArray[i].toLowerCase())
        ) {
          req.flash("error", "E-mail address must belong to a custom company domain.");
          return res.redirect("/buyer/sign-up");
          
        } else {
          if (req.body.password.length < 6 || req.body.password.length > 16) {
            req.flash("error", "Password must have between 6 and 16 characters.");
            return res.redirect("/buyer/sign-up");
          } else {
            let supers = await getDataMongoose('Supervisor', { organizationUniteID: req.body.organizationUniteID });
          
              if (supers && supers.length && !(supers[0].isActive)) {                
                req.flash(
                  "error",
                  "Your Supervisor is currently not active. Please contact them."
                );
                console.log(supers[0]);
                return res.redirect("/buyer/sign-up");
              } else if (1 == 2 && (!supers || supers.length == 0)) {
                
                req.flash(
                  "error",
                  "Invalid UNITE ID. Please select an appropriate ID from the list."
                );
                
                return res.redirect("/buyer/sign-up");
              } else if (global++ < 1) {
                const ipv4 = await internalIp.v4();
                const user = getObjectMongoose('Buyer', { emailAddress: req.body.emailAddress });
              
                if(verifyBanNewUser(req, res, req.body.emailAddress, ipv4)) {
                  return res.status(400).send({
                    msg: 'You are trying to join UNITE from the part of an already banned user. Please refrain from doing so.'
                  });
                }

                if(user) {
                  return res
                    .status(400)
                    .send({
                      msg:
                        "The e-mail address you have entered is already associated with another account."
                    });
                }

                let buyer;

                try {
                  let hash = bcrypt.hashSync(req.body.password, 10);

                  /*
                  bcrypt.hash(req.body.password, 16, async function(
                    err,
                    hash
                  ) {*/
                    buyer = new Buyer({
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
                      balance: req.body.balance,
                      currency: req.body.currency,
                      deptAgencyGroup: req.body.deptAgencyGroup,
                      qualification: req.body.qualification,
                      country: req.body.country,
                      website: req.body.website,
                      facebookURL: req.body.facebookURL,
                      instagramURL: req.body.instagramURL,
                      twitterURL: req.body.twitterURL,
                      linkedinURL: req.body.linkedinURL,
                      otherSocialMediaURL: req.body.otherSocialMediaURL,
                      createdAt: Date.now(),
                      updatedAt: Date.now(),
                      createdAtFormatted: normalFormat(Date.now()),
                      updatedAtFormatted: normalFormat(Date.now())
                    });

                    await buyer.save(async (err) => {
                      if(treatError(req, res, err, "/buyer/sign-up"))
                        return false;

                    req.session.buyer = buyer;
                    req.session.buyerId = buyer._id;
                    await req.session.save((err) => {
                      if (treatError(req, res, err, "/buyer/sign-up"))
                        return false;
                    });

                    let token = new UserToken({
                      _userId: buyer._id,
                      userType: TYPE,
                      token: crypto.randomBytes(16).toString("hex")
                    });

                    await token.save(async function(err) {
                      if (err) {
                        req.flash("error", err.message);
                        console.error(err.message);
                        return res.status(500).send({
                          msg: err.message
                        });
                      }
                    });

                    await sendConfirmationEmail(
                      req.body.organizationName,
                      "/buyer/confirmation/",
                      token.token,
                      req
                    );
                    req.flash(
                      "success",
                      "Buyer signed up successfully! Please confirm your account by checking your e-mail address: " +
                        req.body.emailAddress + " ."
                    );
                    setTimeout(function() {
                      return res.redirect("/buyer/sign-in");
                    }, 250);
                  });                   
                } catch {}
              }
          }
        }
    }
  } else {
    req.flash("error", "Captcha failed!");
    res.redirect("back");
  }
};


exports.getProfile = async (req, res) => {
  if (!req || !req.session) 
    return false;

  let success = search(req.session.flash, "success"), error = search(req.session.flash, "error");
  req.session.flash = [];  
  const countries = await getDataMongoose('Country'); 
  let currencies = await getCurrenciesList();

  res.render("buyer/profile", {
    DEFAULT_CURR: process.env.BID_DEFAULT_CURR,
    FILE_UPLOAD_MAX_SIZE: process.env.FILE_UPLOAD_MAX_SIZE,
    keys: buyerMenuTranslationKeys,
    currencies: currencies,
    successMessage: success,
    countries: countries,
    errorMessage: error,
    profile: req.session.buyer
  });
};


exports.postProfile = async (req, res) => {
  try {
    let doc = await getObjectMongoose('Buyer', { _id: req.body._id });
    const ipv4 = await internalIp.v4();

    doc._id = req.body._id;
    doc.avatar = req.body.avatar;
    doc.role = req.body.role;
    doc.organizationName = req.body.organizationName;
    doc.organizationUniteID = req.body.organizationUniteID;
    doc.contactName = req.body.contactName;
    doc.emailAddress = req.body.emailAddress;
    doc.password = req.body.password;
    doc.ipvs = ipv4;
    doc.isVerified = true;
    doc.isActive = true;
    doc.contactMobileNumber = req.body.contactMobileNumber;
    doc.address = req.body.address;
    doc.balance = req.body.balance;
    doc.currency = req.body.currency;
    doc.deptAgencyGroup = req.body.deptAgencyGroup;
    doc.qualification = req.body.qualification;
    doc.country = req.body.country;
    doc.website = req.body.website;
    doc.facebookURL = req.body.facebookURL;
    doc.instagramURL = req.body.instagramURL;
    doc.twitterURL = req.body.twitterURL;
    doc.linkedinURL = req.body.linkedinURL;
    doc.otherSocialMediaURL = req.body.otherSocialMediaURL;
    doc.createdAt = req.body.createdAt;
    doc.updatedAt = Date.now();
    doc.createdAtFormatted = normalFormat(req.body.createdAt);
    doc.updatedAtFormatted = normalFormat(Date.now());

    MongoClient.connect(URL, { useUnifiedTopology: true }, async function(err, db) {
      if (treatError(req, res, err, "/buyer/profile")) 
        return false;
      
      let dbo = db.db(BASE);

      await dbo
        .collection("buyers")
        .updateOne({ _id: doc._id }, { $set: doc }, async function(
          err,
          resp
        ) {
          if (treatError(req, res, err, "/buyer/profile")) 
            return false;

          req.session.buyer = doc;
          req.session.buyerId = doc._id;
          await req.session.save();
          db.close();

          console.log("Buyer details updated successfully!");
          req.flash("success", "Buyer details updated successfully!");
          setTimeout(function() {
            return res.redirect("/buyer/profile");
          }, 400);
        });
      });    
    //.catch(console.error);
  } catch {
    //return res.redirect('/buyer/profile');
  }
}