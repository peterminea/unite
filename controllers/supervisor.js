const crypto = require('crypto');
const bcrypt = require("bcryptjs");
const Supervisor = require("../models/supervisor");
const Buyer = require("../models/buyer");
const BidRequest = require("../models/bidRequest");
const Token = require('../models/supervisorToken');
const assert = require('assert');
const process = require('process');
const async = require('async');
const MongoClient = require('mongodb').MongoClient;
const URL = process.env.MONGODB_URI, BASE = process.env.BASE;
const { sendConfirmationEmail, sendCancellationEmail, sendInactivationEmail, resendTokenEmail, sendForgotPasswordEmail, sendResetPasswordEmail, sendCancelBidEmail, postSignInBody } = require('../public/templates');

exports.getIndex = (req, res) => {
  if(!req || !req.session) return false;
  const supervisor = req.session.supervisor;

  Buyer.find(
    { organizationUniteID: supervisor.organizationUniteID },
    (err, results) => {
      if (err) {
        req.flash('error', err.message);
        return console.error(err);
      }
        
      res.render("supervisor/index", {
        supervisor: supervisor,
        buyers: results,
        success: req.flash("success")
      });
    }
  );
}


exports.getConfirmation = (req, res) => {
  if(!req.session || !req.session.supervisorId) {
    req.session = req.session? req.session : {};
    req.session.supervisorId = req.params && req.params.token? req.params.token._userId : null;
  }
  
  res.render('supervisor/confirmation', { token: req.params? req.params.token : null });
}

exports.getDelete = (req, res) => {
  res.render('supervisor/delete', {id: req.params.id, organizationUniteID: req.params.organizationUniteID});
}


exports.getResendToken = (req, res) => {
  res.render('supervisor/resend');
}


exports.getChatLogin = (req, res) => {//We need a username, a room name, and a socket-based ID.
  res.render("supervisor/chatLogin", {
    from: req.params.supplierId,
    to: req.params.buyerId,
    fromName: req.params.supplierName,
    toName: req.params.buyerName,
    reqId: req.params.requestId? req.params.requestId : 0,
    reqName: req.params.requestName? req.params.requestName : 'None'
  });
}


exports.getChat = (req, res) => {//Coming from the getLogin above.
  console.log('S');
  res.render("supplier/chat", {
    from: req.params.from,
    to: req.params.to,
    username: req.params.username,
    room: req.params.room,
    fromName: req.params.fromName,
    toName: req.params.toName,
    reqId: req.params.reqId,
    reqName: req.params.reqName
  });
}


async function removeSupervisor(id, req, res, db) {
  //Now delete the messages sent/received by Supervisor:
  await db.collection('messages').deleteMany({ $or: [ { from: id }, { to: id } ] }, function(err, resp1) {
    if(err) {
      req.flash('error', err.message);
      throw err;
    }
  });
  
  //Tokens first, user last.
  await db.collection('supervisortokens').deleteMany({ _userId: id }, function(err, resp1) {
  if(err) {
    req.flash('error', err.message);
    throw err;
    }
  });

  await db.collection('supervisors').deleteOne({ _id: id }, function(err, resp2) {
    if(err) {
      req.flash('error', err.message);
      throw err;
    }
  });
  
  //Mail to the ex-Supervisor to confirm their final deletion:
  sendCancellationEmail('Supervisor', req, 'sent/received messages and all your associated Buyers, including their personal data such as placed orders, sent/received messages');
  db.close();
  return res.redirect("/supervisor/sign-in");
}


async function removeAssociatedBids(req, dbo, id) {
  var promise = BidRequest.find( { buyer: id } ).exec();
  await promise.then(async (bids) => {   
    for(var bid of bids) {//One by one.
      try {
        await dbo.collection('bidcancelreasons').insertOne( {
          title: 'User Cancellation',
          userType: 'Buyer',
          reason: req.body.reason,
          userName: req.body.organizationName,
          createdAt: Date.now()
        }, function(err, obj) {});
      }  
      catch(e) {
        console.error(e);
        req.flash('error', e.message);
        throw e;
      }

      await dbo.collection('bidrequests').deleteOne( { _id: bid._id }, function(err, obj) {
        if(err) {
          req.flash('error', err.message);
          throw err;
        }
      });

      req.body.requestsName = bid.requestName;
      await sendCancelBidEmail(req, bid.suppliersName, bid.buyersName, bid.suppliersEmail, bid.buyersEmail, 'Supplier ', 'Buyer ', req.body.reason);
    }
  });
}


exports.postDelete = function (req, res, next) {  
  var id = req.body.id;
  var uniteID = req.body.organizationUniteID;
  
  try {
    //Find Supervisor's Buyers first:
    MongoClient.connect(URL, {useUnifiedTopology: true}, async function(err, db) {
      var dbo = db.db(BASE);
      
      try {
        await dbo.collection('usercancelreasons').insertOne( {
          title: req.body.reasonTitle,
          reason: req.body.reason,
          userType: req.body.userType,
          userName: req.body.organizationName,
          createdAt: Date.now()
        }, function(err, obj) {
          if(err) {
            req.flash('error', err.message);
            throw err;
          }
        });
      } catch(e) {
        console.error(e);
      }
      
      await dbo.collection('buyers').find({ organizationUniteID: uniteID }).exec().then(async (buyers) => {
        if(!buyers || !buyers.length) {//No buyer data, let's directly pass to Supervisor.
          await removeSupervisor(id, req, res, db);
        } else {
          var len = buyers.length;
          var complexReason = 'Buyer\'s account was deleted because their Supervisor did the same. See more details:\n' + req.body.reason;
          
          //Delete buyers data one by one:
          for(var i in buyers) {
            var theId = buyers[i]._id;
            var req2 = { body: { reason: complexReason, emailAddress : buyers[i].emailAddress, organizationName : buyers[i].organizationName } };
            
            //Bids:
            await removeAssociatedBids(req2, dbo, theId);          

            //Now delete the messages sent/received by Buyer:
            await dbo.collection('messages').deleteMany({ $or: [ { from: theId }, { to: theId } ] }, function(err, resp0) {
              if(err) {
                req.flash('error', err.message);
                throw err;
              }
            });

            //Remove the possibly existing Buyer Tokens:
            await dbo.collection('buyertokens').deleteMany({ _userId: theId }, function(err, resp1) {
              if(err) {
                req.flash('error', err.message);
                throw err;
              }
            });

            //And now, remove the Buyer themselves:
            await dbo.collection('buyers').deleteOne({ _id: theId }, function(err, resp2) {
              if(err) {
                req.flash('error', err.message);
                throw err;
              }
            });

            //Finally, send a mail to the ex-Buyer:
            await sendCancellationEmail('Buyer', req2, 'placed orders, sent/received messages', req.body.reason);
          }
          //Get rid of the Supervisor themselves too.
          await removeSupervisor(id, req, res, db);
        }
        
        db.close();
        req.flash('success', 'You have deleted your Supervisor account. We hope that you and your Buyers will be back with us!');
        res.redirect("/supervisor/sign-in");
      });
    });
  } catch {
  }
}



exports.postConfirmation = async function (req, res, next) {
  try {
  await Token.findOne({ token: req.params.token }, async function (err, token) {
    if (!token) {
      req.flash('error', 'We were unable to find a valid token. It may have expired. Please request a new token.');
      res.redirect('/supervisor/resend');
    }

    await Supervisor.findOne({ _id: token._userId, emailAddress: req.body.emailAddress }, async function (err, user) {
        if (!user)
          return res.status(400).send({
          msg: 'We were unable to find a user for this token.' 
        });

        if (user.isVerified) 
          return res.status(400).send({ 
            type: 'already-verified', 
            msg: 'This user has already been verified.' });

          await MongoClient.connect(URL, {useUnifiedTopology: true}, async function(err, db) {//db or client.
            if (err) {
              req.flash('error', err.message);
              throw err;
            }
            
            var dbo = db.db(BASE);
                
            await dbo.collection("supervisors").updateOne({ _id: user._id }, { $set: {isVerified: true} }, function(err, resp) {
                  if(err) {
                    req.flash('error', err.message);
                    console.error(err.message);
                    return res.status(500).send({ 
                      msg: err.message 
                    });
                    
                  }
                
                db.close();
                console.log("The account has been verified. Please log in.");
                req.flash('success', "The account has been verified. Please log in.");
                res.redirect('/supervisor/sign-in');
                });
            });        
        });
    });
  } catch {
    //req.flash('error', 'Error on Verification!');
    //res.redirect('/supervisor/sign-in');
  }
}


exports.postResendToken = function (req, res, next) {
    Supervisor.findOne({ emailAddress: req.body.emailAddress }, async function (err, user) {
        if (!user) 
          return res.status(400).send({ msg: 'We were unable to find a user with that email.' });
        if (user.isVerified) 
          return res.status(400).send({ msg: 'This account has already been verified. Please log in.' });

        var token = new Token({ 
          _userId: user._id, token: 
          crypto.randomBytes(16).toString('hex') });

        await token.save((err) => {
            if (err) {
              return res.status(500).send({
                msg: err.message 
              }); 
            } 
        });
      
        await resendTokenEmail(user, token.token, '/supervisor/confirmation/', req);
        return res.status(200).send('A verification email has been sent to ' + user.emailAddress + '.');
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
          if (err) {
            req.flash('error', err.message);
            throw err;
          }
          var dbo = db.db(BASE);
          dbo.collection("supervisors").updateOne({ _id: user._id }, { $set: {resetPasswordToken: token, resetPasswordExpires: Date.now() + 86400000} }, function(err, res) {        
            if(err) {
              req.flash('error', err.message);
              console.error(err.message);
              throw err;
            }

            db.close();
          });
        });
      });
    },
    function(token, user, done) {
      sendForgotPasswordEmail(user, 'Supervisor', "/supervisor/reset/", token, req);
    }
  ], function(err) {
    if(err) {
      //return next(err);
      req.flash('error', err.message);
      console.error(err);
      res.redirect('/supervisor/forgotPassword');
    }
    
    res.redirect('/supervisor');
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
          dbo.collection("supervisors").updateOne({ _id: user._id }, { $set: {password: req.body.password, resetPasswordToken: undefined, resetPasswordExpires: undefined} }, function(err, resp) {        
            if(err) {
              console.error(err.message);
              req.flash('error', err.message);
              throw err;
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
      sendResetPasswordEmail(user, 'Supervisor', req);
    }
  ], function(err) {
      req.flash('error', err.message);
      res.redirect('/supervisor');
    });
}


exports.getSignIn = (req, res) => {
  if (!req.session.supervisorId || !req.session.supervisor.isVerified)
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


exports.postSignIn = async (req, res) => {
  postSignInBody('supervisor', req, res);
}


let global = 0;
exports.postSignUp = async (req, res) => {
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
          Supervisor.findOne({ emailAddress: req.body.emailAddress }, function (err, user) {
            if (user) 
              return res.status(400).send({ msg: 'The e-mail address you have entered is already associated with another account.'});
        var supervisor;
        try {
          bcrypt.hash(req.body.password, 10, async function(err, hash) {
          //user = new Promise((resolve, reject) => {
            supervisor = new Supervisor({
              role: process.env.USER_REGULAR,
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
            
            await supervisor.save((err) => {
              if (err) {
                req.flash('error', err.message);
                throw err;
              }
              
              req.session.supervisor = supervisor;
              req.session.supervisorId = supervisor._id;
              req.session.save();
              
              var token = new Token({ 
                _userId: supervisor._id,
                token: crypto.randomBytes(16).toString('hex') });
              
              token.save(async function (err) {
                if (err) {
                  req.flash('error', err.message);
                  console.error(err.message);
                  return res.status(500).send({
                    msg: err.message 
                  });
                }

                await sendConfirmationEmail(supervisor.organizationName, "/supervisor/confirmation/", token.token, req);
                req.flash("success", "Supervisor signed up successfully! Please confirm your account by visiting " + req.body.emailAddress + '');
                setTimeout(function() {
                  res.redirect("/supervisor/sign-in");
                }, 150);
                });
              });
            });
          } catch {
          }
        });
      }
    }
  }
}


exports.getProfile = (req, res) => {
  res.render("supervisor/profile", { profile: req.session.supervisor });
}


exports.postProfile = async (req, res) => {
  try {
  await Supervisor.findOne({ _id: req.body._id }, async (err, doc) => {
    if (err) return console.error(err);
    doc._id = req.body._id;
    doc.role = req.body.role;
    doc.organizationName = req.body.organizationName;
    doc.organizationUniteID = req.body.organizationUniteID;
    doc.contactName = req.body.contactName;
    doc.emailAddress = req.body.emailAddress;
    doc.password = req.body.password;
    doc.isVerified = true;
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

    await MongoClient.connect(URL, {useUnifiedTopology: true}, async function(err, db) {//db or client.
      if (err) {
        req.flash('error', err.message);
        throw err;
      }
      
      var dbo = db.db(BASE);
      await dbo.collection("supervisors").updateOne({ _id: doc._id }, { $set: doc }, function(err, resp) {
        if(err) {
          req.flash('error', err.message);
          console.error(err.message);
          res.redirect('/supervisor/profile');
        }
      });
      
    req.session.supervisor = doc;
    req.session.supervisorId = doc._id;
    await req.session.save((err) => {
      if (err) {
        req.flash('error', err.message);
        throw err;
      }
      });
    db.close();  
    req.flash("success", "Supervisor details updated successfully!");
    console.log("Supervisor details updated successfully!");
    setTimeout(function() {
      return res.redirect("/supervisor/profile");
    }, 150);
    });
  })
    .catch(console.error);
  } catch {
    //res.redirect('/supervisor/profile');
  }
}