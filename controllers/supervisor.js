const bcrypt = require("bcryptjs");

const Supervisor = require("../models/supervisor");
const Buyer = require("../models/buyer");

exports.getIndex = (req, res) => {
    const supervisor = req.session.supervisor;

    Buyer.find({ organizationUniteID: supervisor.organizationUniteID }, (err, results) => {
        if (err) return console.error(err);
        console.log(results);
        res.render("supervisor/index", {
            supervisor: supervisor,
            buyers: results,
            success: req.flash('success')
        });
    });
};


exports.getSignIn = (req, res) => {
    if (!req.session.supervisorId)
        res.render("supervisor/sign-in", {
            errorMessage: req.flash("error")
        });
    else res.redirect("/supervisor/");
}


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

exports.getProfile = (req, res) => {
    const supervisor = req.session.supervisor;

    res.render("supervisor/profile", { supervisor: supervisor });
  };

exports.postProfile = (req, res) => {

  const newSupervisor = new Supervisor({
    _id: req.body._id,
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
    UNITETermsAndConditions: req.body.UNITETermsAndConditions,  
    antibriberyAgreement: req.body.antibriberyAgreement
  });

  return newSupervisor.save().then(result => {
        req.flash('success', 'Supervisor details updated successfully!');
        return res.redirect("/supervisor/profile");
      }).catch(console.error);
}