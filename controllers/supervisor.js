const crypto = require('crypto');
const bcrypt = require("bcryptjs");
const Supervisor = require("../models/supervisor");
const Buyer = require("../models/buyer");
const Token = require('../models/supervisorToken');
const assert = require('assert');
const process = require('process');
const async = require('async');
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
const MongoClient = require('mongodb').MongoClient;
const URL = process.env.MONGODB_URI, BASE = process.env.BASE;

exports.getIndex = (req, res) => {
  if(!req || !req.session) return false;
  const supervisor = req.session.supervisor;

  Buyer.find(
    { organizationUniteID: supervisor.organizationUniteID },
    (err, results) => {
      if (err) return console.error(err);
      res.render("supervisor/index", {
        supervisor: supervisor,
        buyers: results,
        success: req.flash("success")
      });
    }
  );
}


exports.getConfirmation = (req, res) => {
  res.render('supervisor/confirmation', {token: req.params.token});
}


exports.getResendToken = (req, res) => {
  res.render('supervisor/resend');
}


exports.postConfirmation = function (req, res, next) {
  Token.findOne({ token: req.params.token }, function (err, token) {
    if (!token) {
      req.flash('We were unable to find a valid token. It may have expired. Please request a new token.');
      res.redirect('/supervisor/resend');
      if(1==2) 
        return res.status(400).send({
        type: 'not-verified', 
        msg: 'We were unable to find a valid token. Your token may have expired.' });
    }

    Supervisor.findOne({ _id: token._userId, emailAddress: req.body.emailAddress }, function (err, user) {
        if (!user)
          return res.status(400).send({
          msg: 'We were unable to find a user for this token.' 
        });

        if (user.isVerified) 
          return res.status(400).send({ 
          type: 'already-verified', 
          msg: 'This user has already been verified.' });           

          MongoClient.connect(URL, {useUnifiedTopology: true}, function(err, db) {//db or client.
                if (err) throw err;
                var dbo = db.db(BASE);
                var myquery = { _id: user._id };
                var newvalues = { $set: {isVerified: true} };
                dbo.collection("supervisors").updateOne(myquery, newvalues, function(err, resp) {
                  if(err) {
                    console.error(err.message);
                    /*
                    return res.status(500).send({ 
                      msg: err.message 
                    });
                    */
                    return false;
                  }                   

                  console.log("The account has been verified. Please log in.");
                  req.flash('success', "The account has been verified. Please log in.");
                  db.close();
                  if(res) 
                    res.status(200).send("The account has been verified. Please log in.");
                });
              });        
        });
    });
}


exports.postResendToken = function (req, res, next) {
    Supervisor.findOne({ emailAddress: req.body.emailAddress }, function (err, user) {
        if (!user) 
          return res.status(400).send({ msg: 'We were unable to find a user with that email.' });
        if (user.isVerified) 
          return res.status(400).send({ msg: 'This account has already been verified. Please log in.' });

        var token = new Token({ 
          _userId: user._id, token: 
          crypto.randomBytes(16).toString('hex') });

        token.save(function (err) {
            if (err) { return res.status(500).send({
              msg: err.message 
              }); 
            } 
         
            var mailOptions = {
              from: 'peter@uniteprocurement.com',
              to: user.emailAddress,
              subject: 'Account Verification Token',
              text:
                        "Hello,\n\n" +
                        "Please verify your account by clicking the link: \nhttp://" +
                        req.headers.host +
                        "/supervisor/confirmation/" +
                        token.token +
                        "\n" };
          
              sgMail.send(mailOptions, function (err, info) {
                 if (err ) {
                  console.log(err);
                }  else {
                  console.log('Message sent: ' + info.response);                
                }
                if (err) {
                  return res.status(500).send({
                        msg: err.message 
                      });
                         }
                  return res.status(200).send('A verification email has been sent to ' + user.emailAddress + '.');
                });
        }); 
    });
}


exports.getForgotPassword = (req, res) => {
  res.render("supervisor/forgotPassword", {
    email: req.session.supervisor.emailAddress//We pre-fill the e-mail field with the address.
  });
}


exports.postForgotPassword = (req, res, next) => {
  async.waterfall([
    function(done) {
      crypto.randomBytes(20, function(err, buf) {
        var token = buf.toString('hex');
        done(err, token);
      });
    },
    function(token, done) {
      Supervisor.findOne({ emailAddress: req.body.emailAddress }, function (err, user) {
        if (!user) {
          req.flash('error', 'Sorry. We were unable to find a user with this e-mail address.');
          return res.redirect('supervisor/forgotPassword');
        }
        
        MongoClient.connect(URL, {useUnifiedTopology: true}, function(err, db) {
          if (err) throw err;
          var dbo = db.db(BASE);
          var myquery = { _id: user._id };
          var newvalues = { resetPasswordToken: token, resetPasswordExpires: Date.now() + 86400000};
          dbo.collection("supervisors").updateOne(myquery, newvalues, function(err, res) {        
            if(err) {
              console.error(err.message);
              return false;
            }

            db.close();
          });
        });
      });
    },
    function(token, user, done) {     
      var emailOptions = {
        from: 'peter@uniteprocurement.com',
        to: user.emailAddress, 
        subject: 'UNITE Password Reset - Supervisor', 
        text:
            "Hello,\n\n" +
            "You have received this e-mail because you requested a Supervisor password reset on our UNITE platform." +
            " Please reset your password within 24 hours, by clicking the link: \nhttp://" + req.headers.host + "/supervisor/reset/" + token + "\n"
        };
      
      sgMail.send(emailOptions, function (err, info) {
        console.log('E-mail sent!')
        req.flash('success', 'An e-mail has been sent to ' + user.emailAddress + ' with password reset instructions.');
        done(err, 'done');
      });
    }
  ], function(err) {
    if(err)
      //return next(err);
      console.error(err);
      res.redirect('/supervisor/forgotPassword');
  });
}


exports.getResetPasswordToken = (req, res) => {
  Supervisor.findOne({resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() }}, function(err, user) {
    if(!user) {
      req.flash('error', 'Password reset token is either invalid or expired.');
      return res.redirect('/supervisor/forgotPassword');
    }
    res.render('supervisor/resetPassword', {token: req.params.token});
  });
}


exports.postResetPasswordToken = (req, res) => {
  async.waterfall([
    function(done) {
      Supervisor.findOne({resetPasswordToken: req.params.token, 
                     resetPasswordExpires: { $gt: Date.now() }
                    }, function(err, user) {
      if(!user) {
        req.flash('error', 'Password reset token is either invalid or expired.');
        return res.redirect('back');
      }
        
    if(req.body.password === req.body.confirm) {
        MongoClient.connect(URL, {useUnifiedTopology: true}, function(err, db) {
          if (err) throw err;
          var dbo = db.db(BASE);
          var myquery = { _id: user._id };
          var newvalues = { password: req.body.password, resetPasswordToken: undefined, resetPasswordExpires: undefined};
          dbo.collection("supervisors").updateOne(myquery, newvalues, function(err, resp) {        
            if(err) {
              console.error(err.message);
              return false;
              }

            db.close();
            });
          });
        } else {
          req.flash('error', 'Passwords do not match.');
          return res.redirect('back');
        }
      });
    },
    function(user, done) {      
      var emailOptions = {
        from: 'peter@uniteprocurement.com',
        to: user.emailAddress, 
        subject: 'UNITE Password changed - Supervisor', 
        text: 'Hello,\n\n' 
        + 'You have successfully reset your Supervisor password on our UNITE platform'
        + 'for the account registered with ' + user.emailAddress + '. You can log in again.'        
      };
      
      sgMail.send(emailOptions, function (err, info) {
        console.log('E-mail sent!')
        req.flash('success', 'Your password has been successfully changed!');
        done(err, 'done');
      });      
    }
  ], function(err) {
      res.redirect('/supervisor');
    });
}


exports.getSignIn = (req, res) => {
  if(!req.session.supervisorId)
    res.render("supervisor/sign-in", {
      errorMessage: req.flash("error")
    });
  else res.redirect("/supervisor");
}


exports.getSignUp = (req, res) => {
  if(!req.session.supervisorId)
    res.render("supervisor/sign-up", {
      errorMessage: req.flash("error")
    });
  else 
    res.redirect("/supervisor");
}


exports.postSignIn = (req, res) => {
  const email = req.body.emailAddress;
  const password = req.body.password;
  const rememberUser = req.body.remember;  

  if(!email) {
    console.error('E-mail is mandatory!');
    req.flash("error", "E-mail is mandatory!");
    res.redirect("/supervisor/sign-in");
    }
  else {
    Supervisor.findOne({ emailAddress: email, password: password}, (err, doc) => {
      if (err) 
        return console.error(err);
      
      console.log(doc);      
      if (!doc) {
        req.flash("error", "Invalid e-mail address or password");
        return res.redirect("/supervisor/sign-in");
      }

    try {
      bcrypt
        .compare(password, doc.password)
        .then((doMatch) => {
          if (doMatch || (password === doc.password && email === doc.emailAddress)) {
            if (!doc.isVerified) 
              return res.status(401).send({
                type: 'not-verified',
                msg: 'Your account has not been verified. Please check your e-mail for instructions.' });
            
            req.session.supervisorId = doc._id;
            req.session.supervisor = doc;
            if(!req.session.cookie) {
              req.session.cookie = {};
            }
            
            req.session.cookie.originalMaxAge = req.body.remember? null : 7200000;
            req.session.save();
          } else {
            req.flash("error", "Passwords and e-mail do not match!");
            res.redirect("/supervisor/sign-in");
          }
        })        
        .then((err) => {
          if (err) {
          console.error(err);
          res.redirect("/supervisor/sign-in");
          }
        })
        .catch(console.error);
      } catch {
        res.redirect("/supervisor/sign-in");
      }
    });
  }
}


let global = 0;
exports.postSignUp = (req, res) => {
  if (req.body.emailAddress) {
    const email = req.body.emailAddress;
    const email_str_arr = email.split("@");
    const domain_str_location = email_str_arr.length - 1;
    const final_domain = email_str_arr[domain_str_location];
    var prohibitedArray = ["gmail.com", "hotmail.com", "outlook.com", "yandex.com", "yahoo.com", "gmx"];
    
    for(var i = 0; i < prohibitedArray.length; i++)
    if (final_domain.toLowerCase().includes(prohibitedArray[i].toLowerCase())) {
      req.flash("error", "E-mail address must be a custom company domain.");
      res.redirect("back");
    } else {
      if (req.body.password.length < 6) {
        req.flash("error", "Password must have at least 6 characters.");
        res.redirect("back");
        } else if(global++ < 1) {
          // Make sure this account doesn't already exist
          Supervisor.findOne({ emailAddress: req.body.emailAddress }, function (err, user) {
            if (user) 
              return res.status(400).send({ msg: 'The e-mail address you have entered is already associated with another account.'});
        var supervisor;
        try {
          bcrypt.hash(req.body.password, 10, function(err, hash) {
          //user = new Promise((resolve, reject) => {
            supervisor = new Supervisor({
              organizationName: req.body.organizationName,
              organizationUniteID: req.body.organizationUniteID,
              contactName: req.body.contactName,
              emailAddress: req.body.emailAddress,
              password: req.body.password,
              isVerified: false,
              contactMobileNumber: req.body.contactMobileNumber,
              address: req.body.address,
              country: req.body.country,
              certificates: req.body.certificates,
              antibriberyPolicy: req.body.antibriberyPolicy,
              environmentPolicy: req.body.environmentPolicy,
              qualityManagementPolicy: req.body.qualityManagementPolicy,
              occupationalSafetyAndHealthPolicy: req.body.occupationalSafetyAndHealthPolicy,
              otherRelevantFiles: req.body.otherRelevantFiles,
              UNITETermsAndConditions: true,
              antibriberyAgreement: true,
              createdAt: Date.now(),
              updatedAt: Date.now()
            });
            
            supervisor.save((err) => {
              if (err) {
                throw err;
              }
              
              req.session.supervisor = supervisor;
              req.session.id = supervisor._id;
              req.session.save();
              var token = new Token({ 
                _userId: supervisor._id,
                token: crypto.randomBytes(16).toString('hex') });
              
              token.save(function (err) {
                if (err) {
                  console.error(err.message);
                  //return res.status(500).send({
                   // msg: err.message 
                 // });
                }

                var email = {
                  from: 'peter@uniteprocurement.com',
                  to: supervisor.emailAddress,
                  subject: 'Account Verification Token', 
                  text: "Hello " + supervisor.organizationName +
                        ",\n\nCongratulations for registering on the UNITE Public Procurement Platform!\n\nPlease verify your account by clicking the link: \nhttp://" 
                      + req.headers.host + "/supervisor/confirmation/" + token.token + "\n"
                };

                sgMail.send(email, function (err, resp) {
                    if (err) {
                      console.error(err.message)
                      return res.status(500).send({ msg: err.message }); 
                    } else {
                      req.flash('success', 'A verification email has been sent to ' + supervisor.emailAddress + '.');
                      console.log('A verification email has been sent to ' + supervisor.emailAddress + '.');
                      req.flash("success", "Supervisor signed up successfully!");
                      if(typeof res !== 'undefined') 
                        return res.redirect("/supervisor");
                    //return res.status(200).send('A verification email has been sent to ' + supervisor.emailAddress + '.');
                    }
                  });
                });
              });
            });
          } catch {
            res.redirect('/supervisor/sign-up');
          }
        });
      }
    }
  }
}


exports.getProfile = (req, res) => {
  res.render("supervisor/profile", { profile: req.session.supervisor });
}


exports.postProfile = (req, res) => {
  try {
  Supervisor.findOne({ _id: req.body._id }, (err, doc) => {
    if (err) return console.error(err);
    doc._id = req.body._id;
    doc.organizationName = req.body.organizationName;
    doc.organizationUniteID = req.body.organizationUniteID;
    doc.contactName = req.body.contactName;
    doc.emailAddress = req.body.emailAddress;
    doc.password = req.body.password;
    doc.isVerified = req.body.isVerified;
    doc.contactMobileNumber = req.body.contactMobileNumber;
    doc.address = req.body.address;
    doc.country = req.body.country;
    doc.certificates = req.body.certificates;
    doc.antibriberyPolicy = req.body.antibriberyPolicy;
    doc.environmentPolicy = req.body.environmentPolicy;
    doc.qualityManagementPolicy = req.body.qualityManagementPolicy;
    doc.occupationalSafetyAndHealthPolicy = req.body.occupationalSafetyAndHealthPolicy;
    doc.otherRelevantFiles = req.body.otherRelevantFiles;
    doc.UNITETermsAndConditions = req.body.UNITETermsAndConditions == 'on'? true : false;
    doc.antibriberyAgreement = req.body.antibriberyAgreement == 'on'? true : false;
    doc.createdAt = req.body.createdAt;
    doc.updatedAt = Date.now();

    MongoClient.connect(URL, {useUnifiedTopology: true}, function(err, db) {//db or client.
      if (err) 
        throw err;
      var dbo = db.db(BASE);
      var myquery = { _id: doc._id };
      var newvalues = { $set: doc };
      dbo.collection("supervisors").updateOne(myquery, newvalues, function(err, resp) {
        if(err) {
          console.error(err.message);
          return false;
        }
        req.session.supervisor = doc;
        req.session.id = doc._id;
        req.session.save((err) => {
          if (err)
            throw err;
          
          db.close();
          req.flash("success", "Supervisor details updated successfully!");
          console.log("Supervisor details updated successfully!");
          return res.redirect("/supervisor");
        });
      });
    });
  })
    .catch(console.error);
  } catch {
    res.redirect('/supervisor/profile');
  } 
}