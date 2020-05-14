const Message = require("../models/message");
const express = require("express");
const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Supplier = require("../models/supplier");
const Buyer = require("../models/buyer");

exports.getIndex = (req, res) => {
  res.render("chat/index", {
    //buyer: req.session.buyer.organizationName,
    //suppliers: null,
    success: req.flash("success")
  });
};

