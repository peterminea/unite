
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
    userId: obj.userId,
    userName: obj.userName,
    userType: obj.userType
  });
};

exports.getAbout = (req, res) => {
  var obj = userData(req);
  res.render("about", {
    userId: obj.userId,
    userName: obj.userName,
    userType: obj.userType
  });
}

exports.getAntibriberyAgreement = (req, res) => {
  var obj = userData(req);
  res.render("antibriberyAgreement", {
    userId: obj.userId,
    userName: obj.userName,
    userType: obj.userType
  });
};

exports.getTermsConditions = (req, res) => {
  var obj = userData(req);
  res.render("termsConditions", {
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
    
    for(var buyer of buyers) {
      buys.push(buyer);
    }
  });
  
  promise = Supervisor.find({}).exec();
  await promise.then((sups) => {
    sups.sort(function (a, b) {
      return a.organizationName.localeCompare(b.organizationName);
    });
    
    for(var sup of sups) {
      //console.log(sup.organizationName);
      supers.push(sup);
    }
  });

  promise = Supplier.find({}).exec();
  await promise.then((suppliers) => {
    suppliers.sort(function (a, b) {
      return a.companyName.localeCompare(b.companyName);
    });
    
    for(var sup of suppliers) {
      supps.push(sup);
    }
  });
  
  console.log(buys.length + ' ' + supers.length + ' ' + supps.length);
  for(var sup in supers)
    console.log(supers.organizationUniteID);
  
  var obj = userData(req);  
  res.render("memberList", {
    buyers: buys,
    suppliers: supers,
    supervisors: supps,
    userId: obj.userId,
    userName: obj.userName,
    userType: obj.userType
  });
}