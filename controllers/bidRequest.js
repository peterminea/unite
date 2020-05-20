const express = require("express");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const BidRequest = require("../models/bidRequest");

exports.getIndex = (req, res) => {
  res.render("bidRequest/index", {
    request: req.session.request,
    //suppliers: null,
    success: req.flash("success")
  });
};

exports.postIndex = (req, res) => {
      const bidRequest = new BidRequest({
      itemDescription: req.body.itemDescription,
      productsServicesOffered: req.body.productsServicesOffered,
      itemDescriptionLong: req.body.longItemDescription,
      itemDescriptionUrl: req.urlItemDescription,
      amount: req.body.amount,
      deliveryLocation: req.body.deliveryLocation,
      deliveryRequirements: req.body.deliveryRequirements,
      complianceRequirements: req.body.complianceRequirements,
      complianceRequirementsUrl: req.body.complianceRequirementsUrl,
      otherRequirements: req.body.otherRequirements,
      status: req.body.status,
      price: req.body.price,
      createdAt: req.body.createdAt,
      updatedAt: Date.now(),
      buyer: req.body.buyer,
      supplier: req.body.supplier
    });

    return bidRequest
      .save()
      .then(result => {
        req.flash("success", "Bid updated successfully!");
        return res.redirect("/buyer");
      })
      .catch(console.error);
};