const bcrypt = require("bcryptjs");
const Supervisor = require("../models/supervisor");
const Buyer = require("../models/buyer");

exports.getIndex = (req, res) => {
  const supervisor = req.session.supervisor;

  Buyer.find(
    { organizationUniteID: supervisor.organizationUniteID },
    (err, results) => {
      if (err) return console.error(err);
      console.log(results);
      res.render("supervisor/index", {
        supervisor: supervisor,
        buyers: results,
        success: req.flash("success")
      });
    }
  );
};

exports.getSignIn = (req, res) => {
  if (!req.session.supervisorId)
    res.render("supervisor/sign-in", {
      errorMessage: req.flash("error")
    });
  else res.redirect("/supervisor/");
};

exports.getSignUp = (req, res) => {
  if (!req.session.supervisor)
    return res.render("supervisor/sign-up", {
      errorMessage: req.flash("error")
    });
  else res.redirect("/supervisor");
};

exports.postSignIn = (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  if (!email) res.redirect("supervisor/sign-in");
  else {
    Supervisor.findOne({ emailAddress: email }, (err, doc) => {
      if (err) return console.error(err);

      if (!doc) {
        req.flash("error", "Invalid e-mail address or password");
        return res.redirect("/supervisor/sign-in");
      }

      bcrypt
        .compare(password, doc.password)
        .then(doMatch => {
          if (doMatch) {
            req.session.supervisorId = doc._id;
            req.session.supervisor = doc;
            return req.session.save();
          } else {
            req.flash("error", "Invalid e-mail address or password");
            res.redirect("/supervisor/sign-in");
          }
        })
        .then(err => {
          if (err) return console.error(err);
          res.redirect("/supervisor/");
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

    if (
      final_domain == "gmail.com" ||
      final_domain == "hotmail.com" ||
      final_domain.includes("outlook.com") ||
      final_domain.includes("yandex.com") ||
      final_domain.includes("yahoo.com") ||
      final_domain.includes("gmx")
    ) {
      req.flash("error", "E-mail address has not a custom company domain.");
      res.redirect("/supervisor/sign-up");
    } else {
      if (req.password < 6) {
        req.flash("error", "Password must have 6 characters at least.");
        res.redirect("/supervisor/sign-up");
      } else {
        const supervisor = new Supervisor({
          organizationName: req.body.organizationName,
          organizationUniteID: req.body.organizationUniteID,
          contactName: req.body.contactName,
          emailAddress: req.body.emailAddress,
          password: req.body.password,
          address: req.body.address,
          country: req.body.country,
          certificatesUrls: req.body.certificatesUrls,
          antibriberyPolicyUrl: req.body.antibriberyPolicyUrl,
          environmentPolicyUrl: req.body.environmentPolicyUrl,
          qualityManagementPolicyUrl: req.body.qualityManagementPolicyUrl,
          occupationalSafetyAndHealthPolicyUrl: req.body.occupationalSafetyAndHealthPolicyUrl,
          otherRelevantFilesUrls: req.body.otherRelevantFilesUrls,
          UNITETermsAndConditions: true,
          antibriberyAgreement: true
        });

        supervisor
          .save()
          .then(doc => {
            req.session.supervisor = doc;
            req.session.id = doc._id;
            return req.session.save();
          })
          .then(() => {
            req.flash("success", "Supervisor signed up successfully!");
            return res.redirect("/supervisor");
          })
          .catch(console.error);
      }
    }
  }
};

exports.getProfile = (req, res) => {
  res.render("supervisor/profile", { profile: req.session.supervisor });
};

exports.postProfile = (req, res) => {
  Supervisor.findOne({ _id: req.body._id }, (err, doc) => {
    if (err) return console.error(err);
    
    doc.organizationName = req.body.organizationName;
    doc.organizationUniteID = req.body.organizationUniteID;
    doc.contactName = req.body.contactName;
    doc.emailAddress = req.body.emailAddress;
    doc.password = req.body.password;
    doc.address = req.body.address;
    doc.country = req.body.country;
    doc.certificatesUrls = req.body.certificatesUrls;
    doc.antibriberyPolicyUrl = req.body.antibriberyPolicyUrl;
    doc.environmentPolicyUrl = req.body.environmentPolicyUrl;
    doc.qualityManagementPolicyUrl = req.body.qualityManagementPolicyUrl;
    doc.occupationalSafetyAndHealthPolicyUrl = req.body.occupationalSafetyAndHealthPolicyUrl;
    doc.otherRelevantFilesUrls = req.body.otherRelevantFilesUrls;
    doc.UNITETermsAndConditions = req.body.UNITETermsAndConditions == 'on'? true : false;
    doc.antibriberyAgreement = req.body.antibriberyAgreement == 'on'? true : false;

    return doc.save();
  })
    .then(doc => {
      req.session.supervisor = doc;
      req.session.id = doc._id;
      return req.session.save();
    })
    .then(() => {
      req.flash("success", "Supervisor details updated successfully!");
      return res.redirect("/supervisor");
    })
    .catch(console.error);
};