const express = require("express");
const bcrypt = require("bcryptjs");
const Buyer = require("../models/buyer");
const Supplier = require("../models/supplier");

exports.getIndex = (req, res) => {
  res.render("buyer/index", {
    organization: req.session.buyer.organizationName,
    suppliers: null
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
        organization: req.session.buyer.organizationName,
        suppliers: suppliers2
      });
    });
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
        return res.redirect("/supplier/sign-in");
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
            res.redirect("/supplier/sign-in");
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
