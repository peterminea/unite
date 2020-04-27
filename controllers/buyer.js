const express = require("express");
const bcrypt = require("bcryptjs");

const Buyer = require("../models/buyer");
const Supplier = require("../models/supplier");
const BidRequest = require("../models/bidRequest");

exports.getIndex = (req, res) => {
  res.render("buyer/index", {
    buyer: req.session.buyer.organizationName,
    suppliers: null,
    success: req.flash('success')
  });
};

exports.postIndex = (req, res) => {
  if (req.body.capabilityInput) {
    const key = req.body.capabilityInput;

    Supplier.find({}, (err, suppliers) => {
      if (err) return console.error(err);

      const suppliers2 = [];

      for (const supplier of suppliers) {
        if (
          supplier.capabilityDescription
            .toLowerCase()
            .includes(key.toLowerCase())
        ) {
          suppliers2.push(supplier);
        }
      }
      res.render("buyer/index", {
        buyer: req.session.buyer,
        suppliers: suppliers2,
        success: req.flash('success')
      });
    });
  } else if (req.body.itemDescription) {
    console.log(req.body.longItemDescription);
    const bidRequest = new BidRequest({
      itemDescription: req.body.itemDescription,
      commodityList: req.body.commodityList,
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
      buyer: req.body.buyer,
      supplier: req.body.supplier
    });

    return bidRequest.save().then(result => {
      req.flash('success', 'Bid requested successfully!');
      return res.redirect("/buyer");
    }).catch(console.error);
  } else {
    res.redirect("/buyer");
  }
};

exports.getSignIn = (req, res) => {
  if (!req.session.organizationId)
    res.render("buyer/sign-in", {
      errorMessage: req.flash("error")
    });
  else res.redirect("/buyer/");
};

exports.postSignIn = (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  if (!email) res.redirect("buyer/sign-in");
  else {
    Buyer.findOne({ emailAddress: email }, (err, doc) => {
      if (err) return console.error(err);

      if (!doc) {
        req.flash("error", "Invalid e-mail address or password");
        return res.redirect("/buyer/sign-in");
      }

      bcrypt
        .compare(password, doc.password)
        .then(doMatch => {
          if (doMatch) {
            req.session.organizationId = doc._id;
            req.session.buyer = doc;
            return req.session.save();
          } else {
            req.flash("error", "Invalid e-mail address or password");
            res.redirect("/buyer/sign-in");
          }
        })
        .then(err => {
          if (err) return console.error(err);
          res.redirect("/buyer/");
        })
        .catch(console.error);
    });
  }
};

exports.getProfile = (req, res) => {
  res.render("buyer/profile", { profile: req });
};


exports.postProfile = (req, res) => {

  const newBuyer = new Buyer({
    _id: req.body._id,
    organizationName: req.body.organizationName,
    organizationUniteID: req.body.organizationUniteID,
    contactName: req.body.contactName,
    emailAddress: req.body.emailAddress,
    password: req.body.password,
    address: req.body.address,
    balance: req.body.balance,
    deptAgencyGroup: req.body.deptAgencyGroup,
    qualification: req.body.qualification,
    country: req.body.country  
  });

  return newBuyer.save().then(result => {
        req.flash('success', 'Buyer details updated successfully!');
        return res.redirect("/buyer/profile");
      }).catch(console.error);
}