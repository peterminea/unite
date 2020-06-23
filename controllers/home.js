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
const { removeAssociatedBuyerBids, removeAssociatedSuppBids, buyerDelete, supervisorDelete, supplierDelete } = require('../middleware/deletion');

var userData = require('../middleware/userHome');

exports.getIndex = (req, res) => {
  var obj = userData(req);
  //console.log(obj);
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


exports.getFilesList = (req, res) => {
  var obj = userData(req);
  var success = search(req.session.flash, 'success'), error = search(req.session.flash, 'error');
  req.session.flash = [];
  const conn = mongoose.createConnection(URL, {useNewUrlParser: true, useUnifiedTopology: true});
  const Grid = require('gridfs-stream');
  let gfs;
  
  conn.once('open', () => {
    gfs = Grid(conn.db, mongoose.mongo);
    gfs.collection('uploads');    
    
    gfs.files.find().toArray((err, files) => {
      if(!files || !files.length) {
        return res.status(404).json({
          err: 'No files exist!'
        });
      }

      //console.log(obj);
      res.render("filesList", {
        role: obj.role,
        files: files,
        successMessage: success,
        errorMessage: error,
        isAdmin: obj.role == process.env.USER_ADMIN,
        userId: obj.userId,
        avatar: obj.avatar,
        userName: obj.userName,
        userType: obj.userType
      });
        //return res.json(files);
    });
  });
};

exports.getFeedback = (req, res) => {
  var obj = userData(req);
  var success = search(req.session.flash, 'success'), error = search(req.session.flash, 'error');
  req.session.flash = [];
  
  res.render("feedback", {
    role: obj.role,
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


exports.postFeedback = (req, res) => {
  try {
    //Bad Words:
    const filter = new BadWords();
    if(filter.isProfane(req.body.details)) {
      req.flash('error', 'We do not promote profanity here on UNITE. Please use an educated language. The feedback will not be posted otherwise. Thank you for understanding!');
      return res.redirect('/feedback')
    }
    
    MongoClient.connect(URL, {useUnifiedTopology: true}, async function(err, db) {//db or client.
       treatError(req, res, err, 'back');
        var dbo = db.db(BASE);
        await dbo.collection("feedbacks").insertOne({
          userName: req.body.name,
          userEmail: req.body.emailAddress,
          subject: req.body.subject,
          message: req.body.details,
          createdAt: Date.now()
        }, function(err, obj) {
            treatError(req, res, err, 'back');
            req.flash('success', 'Feedback successfully sent! Thanks for your opinion. We will get back to you.');
            db.close();
            res.redirect('/feedback');
        });
      });
    } catch {
  }
};


exports.postDeleteUser = async (req, res) => {  
  var id = req.body.deleteId, type = req.body.userType;
  
  switch(type) {
    case process.env.USER_BUYER:
      req.body.organizationName = req.body.name;
      await buyerDelete(req, res, id);
      res.redirect('/memberList');
      break;
      
    case process.env.USER_SPV:
      req.body.organizationName = req.body.name;
      req.body.organizationUniteID = req.body.uniteID;
      await supervisorDelete(req, res, id, req.body.organizationUniteID);
      res.redirect('/memberList');
      break;
      
    case process.env.USER_SUPPLIER:
      req.body.companyName = req.body.name;
      await supplierDelete(req, res, id);
      res.redirect('/memberList');
      break;
      
    default:
      break;
  }
};