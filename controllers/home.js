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
const URL = process.env.MONGODB_URI, BASE = process.env.BASE;

var userData = require('../middleware/userHome');

exports.getIndex = (req, res) => {
  var obj = userData(req);
  //console.log(obj);
  res.render("index", {
    role: obj.role,
    isAdmin: obj.role == process.env.USER_ADMIN,
    userId: obj.userId,
    userName: obj.userName,
    userType: obj.userType
  });
};

exports.getFilesList = (req, res) => {
  var obj = userData(req);
  const conn = mongoose.createConnection(URL, {useNewUrlParser: true, useUnifiedTopology: true});
  const Grid = require('gridfs-stream');
  let gfs;
  
  conn.once('open', () => {
    gfs = Grid(conn.db, mongoose.mongo);
    gfs.collection('uploads');
    //console.log(gfs);
    
    gfs.files.find().toArray((err, files) => {//console.log(files);                                              
      if(!files || !files.length) {
        return res.status(404).json({
          err: 'No files exist!'
        });
      }

      //console.log(obj);
      res.render("filesList", {
        role: obj.role,
        files: files,
        isAdmin: obj.role == process.env.USER_ADMIN,
        userId: obj.userId,
        userName: obj.userName,
        userType: obj.userType
      });
        //return res.json(files);
    });
  });
};

exports.getFeedback = (req, res) => {
  var obj = userData(req);
  res.render("feedback", {
    role: obj.role,
    isAdmin: obj.role == process.env.USER_ADMIN,
    userId: obj.userId,
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

  var obj = userData(req);  
  res.render("memberList", {
    buyers: buys,
    suppliers: supps,
    supervisors: supers,
    userId: obj.userId,
    userName: obj.userName,
    userType: obj.userType
  });
}


exports.postFeedback = (req, res) => {
  try {
    MongoClient.connect(URL, {useUnifiedTopology: true}, async function(err, db) {//db or client.
        if (err) {
          req.flash('error', err.message);
          throw err;
        }

        var dbo = db.db(BASE);
        await dbo.collection("feedbacks").insertOne({
          userName: req.body.name,
          userEmail: req.body.emailAddress,
          subject: req.body.subject,
          message: req.body.details,
          createdAt: Date.now()
        }, function(err, obj) {
            if(err) {
              req.flash('error', err.message);
              throw err;
            }

          req.flash('success', 'Feedback successfully sent! We will get back to you.');
          db.close();
          res.redirect('/');
        });
      });
    } catch {
  }
};