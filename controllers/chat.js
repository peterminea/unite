const express = require("express");
const bodyParser = require("body-parser");
const connectdb = require("../dbconnect");
const Message = require("../models/message");
const sessionExit = require("../middleware/session-exit");
const chatController = require("../controllers/chat");
const Supplier = require("../models/supplier");
const Buyer = require("../models/buyer");
const ObjectId = require("mongodb").ObjectId;

exports.getIndex = (req, res, next) => {
      res.setHeader("Content-Type", "application/json");
      res.statusCode  =  200;
      console.log('TATAJURA ' + req.params);

      connectdb.then(db  =>  {
          Message.find({}).then(chat  =>  {
            var supplierFilter = Supplier.find({_id: new ObjectId(chat.from)}, {'companyName': 1} );
            var buyerFilter = Buyer.find({_id: new ObjectId(chat.to)}, {'organizationName': 1});

            buyerFilter.exec(function(err, data) {//organization company
              if(data && data.length) {
                chat.fromName = data[0].organizationName;
              }
            });

            supplierFilter.exec(function(err, data) {//organization company
              if(data && data.length) {
                chat.toName = data[0].companyName;
              }
            });

            res.json(chat);
      });
  });
                                        
  res.render("chat/index", {
    from: req.params.supplierId,
    to: req.params.buyerId,
    reqId: req.params.requestId,
    fromName: req.params.supplierName,
    toName: req.params.buyerName,
    success: req.flash("success")
  });
};