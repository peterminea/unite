const express = require("express");
const bcrypt = require("bcryptjs");
const Supplier = require("../models/supplier");

exports.getIndex = (req, res) => {
  const supplier = req.session.supplier;
  console.log(req.session.supplier);
  res.render("supplier/index", {
    supplier: supplier
  });
};

exports.getSignIn = (req, res) => {
  if (!req.session.supplier)
    return res.render("supplier/sign-in", {
      errorMessage: req.flash("error")
    });
  else res.redirect("/supplier");
};

exports.postSignIn = (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  if (!email) res.redirect("/supplier/sign-in");
  else {
    Supplier.findOne({ emailAddress: email }, (err, doc) => {
      if (err) return console.error(err);

      if (!doc) {
        req.flash("error", "Invalid e-mail address or password");
        return res.redirect("/supplier/sign-in");
      }

      bcrypt
        .compare(password, doc.password)
        .then(doMatch => {
          if (doMatch) {
            req.session.supplier = doc;
            req.session.id = doc._id;
            return req.session.save();
          } else {
            req.flash("error", "Invalid e-mail address or password");
            res.redirect("/supplier/sign-in");
          }
        })
        .then(err => {
          if (err) return console.error(err);
          res.redirect("/supplier/");
        })
        .catch(console.error);
    });
  }
};

exports.getProfile = (req, res) => {
  res.render("supplier/profile", { profile: req.session.supplier });
};
