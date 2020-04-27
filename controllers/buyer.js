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

exports.getSignUp = (req, res) => {
  if (!req.session.buyer)
    return res.render("buyer/sign-up", {
      errorMessage: req.flash("error")
    });
  else res.redirect("/buyer");
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


exports.postSignUp = (req, res) => {
  if (req.body.emailAddress) {
    const email = req.body.emailAddress;
    const email_str_arr = email.split("@");
    const domain_str_location = email_str_arr.length - 1;
    const final_domain = email_str_arr[domain_str_location];

    if (final_domain == 'gmail.com' || final_domain == 'hotmail.com'
      || final_domain.includes("outlook.com") || final_domain.includes('yandex.com') || final_domain.includes('yahoo.com')
      || final_domain.includes("gmx")) {
      req.flash("error", "E-mail address has not a custom company domain.")
      res.redirect("/buyer/sign-up");
    } else {
      if (req.password < 6) {
        req.flash("error", "Password must have 6 characters at least.")
        res.redirect("/buyer/sign-up");
      } else {        
          const buyer = new Buyer({
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

          buyer.save().then(doc => {
          req.session.buyer = doc;
          req.session.id = doc._id;
          return req.session.save();
        }).then(() => {
          req.flash('success', 'Buyer signed up successfully!');
          return res.redirect("/buyer");
        }).catch(console.error);
      }
    }
  }
}


exports.getProfile = (req, res) => {
  res.render("buyer/profile", { profile: req });
};


exports.postProfile = (req, res) => {
  Buyer.findOne({ _id: req.body._id }, (doc) => {
    doc.organizationName = req.body.organizationName;
    doc.organizationUniteID = req.body.organizationUniteID;
    doc.contactName = req.body.contactName;
    doc.emailAddress = req.body.emailAddress;
    doc.password = req.body.password;
    doc.address = req.body.address;
    doc.balance = req.body.balance;
    doc.deptAgencyGroup = req.body.deptAgencyGroup;
    doc.qualification = req.body.qualification;
    doc.country = req.body.country;
    
    return doc.save();
  }).then(doc => {
    req.session.buyer = doc;
    req.session.id = doc._id;
    return req.session.save();
  }).then(() => {
    req.flash('success', 'Buyer details updated successfully!');
    return res.redirect("/buyer");
  }).catch(console.error);
}