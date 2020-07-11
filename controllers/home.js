const crypto = require('crypto');
const express = require("express");
const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const async = require('async');
const process = require('process');
const MongoClient = require("mongodb").MongoClient;
const Supervisor = require("../models/supervisor");
const Buyer = require("../models/buyer");
const BidRequest = require("../models/bidRequest");
const Supplier = require("../models/supplier");
const ProductService = require("../models/productService");
const Capability = require("../models/capability");
const Message = require("../models/message")
const treatError = require('../middleware/treatError');
const BadWords = require('bad-words');
const search = require('../middleware/searchFlash');
const URL = process.env.MONGODB_URI, BASE = process.env.BASE;
const fs = require("fs");
const { removeAssociatedBuyerBids, removeAssociatedSuppBids, buyerDelete, supervisorDelete, supplierDelete } = require('../middleware/deletion');
const captchaSiteKey = process.env.RECAPTCHA_V2_SITE_KEY;
const captchaSecretKey = process.env.RECAPTCHA_V2_SECRET_KEY;
const fetch = require('node-fetch');

var userData = require('../middleware/userHome');

exports.getIndex = (req, res) => {
  var obj = userData(req);

  res.render("index", {
    role: obj.role,
    isAdmin: obj.role == process.env.USER_ADMIN,
    userId: obj.userId,
    avatar: obj.avatar,
    userName: obj.userName,
    userType: obj.userType
  });
};


exports.getDeleteUser = (req, res) => {
  var obj = userData(req);
  var success = search(req.session.flash, 'success'), error = search(req.session.flash, 'error');
  req.session.flash = [];
  
  res.render("deleteUser", {
    role: obj.role,
    //isAdmin: obj.role == process.env.USER_ADMIN,
    //userId: obj.userId,
    //avatar: obj.avatar,
    deleteId: req.params.id,
    deleteType: req.params.type,
    name: req.params.name,
    uniteID: req.params.uniteID,
    emailAddress: req.params.email,
    successMessage: success,
    errorMessage: error
    //userName: obj.userName,
    //userType: obj.userType
  });
};


function getFiles(folder) {/*
  console.log(folder);
  fs.readdir(folder, (err, files) => {
    files.forEach((file) => {
      //console.log(file);
    });
  });*/

  var t = fs.readdirSync(folder, {withFileTypes: true})
  .filter(item => !item.isDirectory())
  .map((item) => item.name);

  var fileData = [];
    t.forEach((file) => {
      var name = folder+'/'+file;
      var stats = fs.statSync(name);
      var fileSizeInBytes = stats["size"];
      var obj = {
        path: name,
        name: file,
        folder: folder,
        size: stats['size'],
        date: stats['birthtime']
      };
      fileData.push(obj);
    });
 
  return fileData;
}


exports.getFilesList = async (req, res) => {
  var obj = userData(req);
  var success = search(req.session.flash, 'success'), error = search(req.session.flash, 'error');
  req.session.flash = []; 
  var uploads = await getFiles('public/uploads');
  var avatars = await getFiles('public/avatars');
  var files = await getFiles('public/productImages');
  
  console.log(files);

  res.render("filesList", {
    role: obj.role,
    //files: files,
    successMessage: success,
    errorMessage: error,
    isAdmin: obj.role == process.env.USER_ADMIN,
    files: files,
    uploads: uploads,
    avatars: avatars,
    userId: obj.userId,
    avatar: obj.avatar,
    userName: obj.userName,
    userType: obj.userType
  });
    //return res.json(files);
};

exports.getFeedback = (req, res) => {
  var obj = userData(req);
  var success = search(req.session.flash, 'success'), error = search(req.session.flash, 'error');
  req.session.flash = [];
  
  res.render("feedback", {
    role: obj.role,
    captchaSiteKey: captchaSiteKey,
    isAdmin: obj.role == process.env.USER_ADMIN,
    successMessage: success,
    errorMessage: error,
    userId: obj.userId,
    avatar: obj.avatar,
    userName: obj.userName,
    userType: obj.userType
  });
};

exports.getViewFeedbacks = (req, res) => {
  var obj = userData(req);  
  res.render("viewFeedbacks", {
    
    role: obj.role,
    isAdmin: obj.role == process.env.USER_ADMIN,
    userId: obj.userId,
    avatar: obj.avatar,
    userName: obj.userName,
    userType: obj.userType
  });
};

exports.getAbout = (req, res) => {
  var obj = userData(req);
  res.render("about", {
    role: obj.role,
    isAdmin: obj.role == process.env.USER_ADMIN,
    userId: obj.userId,
    avatar: obj.avatar,
    userName: obj.userName,
    userType: obj.userType
  });
}

exports.getAntibriberyAgreement = (req, res) => {
  var obj = userData(req);
  res.render("antibriberyAgreement", {
    role: obj.role,
    isAdmin: obj.role == process.env.USER_ADMIN,
    userId: obj.userId,
    avatar: obj.avatar,
    userName: obj.userName,
    userType: obj.userType
  });
};

exports.getTermsConditions = (req, res) => {
  var obj = userData(req);
  res.render("termsConditions", {
    role: obj.role,
    isAdmin: obj.role == process.env.USER_ADMIN,
    userId: obj.userId,
    avatar: obj.avatar,
    userName: obj.userName,
    userType: obj.userType
  });
}

exports.getBidsList = (req, res) => {
  MongoClient.connect(URL, {useUnifiedTopology: true}, function(err, db) {
    if(treatError(req, res, err, 'back'))
      return false;

    var dbo = db.db(BASE);
    dbo.collection("bidrequests").find({}).toArray(function(err, bids) {
      if(err) {
        console.error(err.message);
        return res.status(500).send({ 
          msg: err.message 
        });
      }

      db.close();
      bids.sort(function(a, b) {
        return a.requestName.localeCompare(b.requestName);
      });
      
      var obj = userData(req);

      res.render('bidsCatalog', {
        role: obj.role,
        isAdmin: obj.role == process.env.USER_ADMIN,
        userId: obj.userId,
        avatar: obj.avatar,
        userName: obj.userName,
        userType: obj.userType,
        bids: bids
        });
      });
  });
};

exports.getMemberList = async (req, res) => {
  //Get all buyers, suppliers, supervisors.
  var buys = [], supers = [], supps = [];
  
  var promise = Buyer.find({}).exec();
  await promise.then((buyers) => {
    buyers.sort(function (a, b) {
      return a.organizationName.localeCompare(b.organizationName);
    });
   // buys = buyers;
   // if(1==2)
    for(var i in buyers) {
      buys.push(buyers[i]);
    }
  });
  
  var promise1 = Supervisor.find({}).exec();
  await promise1.then((sups) => {
    sups.sort(function (a, b) {
      return a.organizationName.localeCompare(b.organizationName);
    });
   // supers = sup;
   // if(1==2)
    for(var i in sups) {      
      supers.push(sups[i]);
    }
  });

  var promise2 = Supplier.find({}).exec();
  await promise2.then((suppliers) => {
    suppliers.sort(function (a, b) {
      return a.companyName.localeCompare(b.companyName);
    });
    //supps = suppliers;
   // if(1==2)
    for(var i in suppliers) {      
      supps.push(suppliers[i]);
    }
  });
  
  var success = search(req.session.flash, 'success'), error = search(req.session.flash, 'error');
  req.session.flash = [];
  var obj = userData(req);
  
  res.render("memberList", {
    buyers: buys,
    role: obj.role,
    isAdmin: obj.role == process.env.USER_ADMIN,
    avatar: obj.avatar,
    suppliers: supps,
    supervisors: supers,
    userId: obj.userId,
    successMessage: success,
    errorMessage: error,
    userName: obj.userName,
    userType: obj.userType
  });
}


exports.postFeedback = async (req, res) => {
  const captchaVerified = await fetch('https://www.google.com/recaptcha/api/siteverify?secret=' + captchaSecretKey + '&response=' + req.body.captchaResponse, {method: 'POST'})
  .then((res0) => res0.json());
  
  console.log(captchaVerified);
  if(((req.body.captchaResponse).length == 0) || captchaVerified.success === true) {
    try {
      //Bad Words:
      const filter = new BadWords();
      if(filter.isProfane(req.body.details)) {
        req.flash('error', 'We do not promote profanity here on UNITE. Please use an educated language. The feedback will not be posted otherwise. Thank you for understanding!');
        return res.redirect('/feedback')
      }

      MongoClient.connect(URL, {useUnifiedTopology: true}, async function(err, db) {//db or client.
         if(treatError(req, res, err, 'back'))
           return false;
          var dbo = db.db(BASE);
          await dbo.collection("feedbacks").insertOne({
            userName: req.body.name,
            userEmail: req.body.emailAddress,
            subject: req.body.subject,
            message: req.body.details,
            createdAt: Date.now()
          }, function(err, obj) {
              if(treatError(req, res, err, 'back'))
                return false;

              req.flash('success', 'Feedback successfully sent! Thanks for your opinion. We will get back to you.');
              db.close();
              return res.redirect('/feedback');
          });
        });
      } catch {
    }
  } else {
      req.flash('error', 'Captcha failed!')
      res.redirect('back');
  }
};


exports.postDeleteUser = async (req, res) => {  
  var id = req.body.deleteId, type = req.body.userType;
  
  switch(type) {
    case process.env.USER_BUYER:
      req.body.organizationName = req.body.name;
      await buyerDelete(req, res, id);
      return res.redirect('/memberList');
      break;
      
    case process.env.USER_SPV:
      req.body.organizationName = req.body.name;
      req.body.organizationUniteID = req.body.uniteID;
      await supervisorDelete(req, res, id, req.body.organizationUniteID);
      return res.redirect('/memberList');
      break;
      
    case process.env.USER_SUPPLIER:
      req.body.companyName = req.body.name;
      await supplierDelete(req, res, id);
      return res.redirect('/memberList');
      break;
      
    default:
      break;
  }
};
