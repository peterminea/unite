const bcrypt = require("bcryptjs");
const Supplier = require("../models/supplier");
const Buyer = require("../models/buyer");
const BidRequest = require("../models/bidRequest");
const BidStatus = require("../models/bidStatus");
const ProductService = require("../models/productService");
const Capability = require("../models/capability");
const Message = require("../models/message");
const sgMail = require("@sendgrid/mail");
const Token = require("../models/supplierToken");
const assert = require("assert");
const process = require("process");
const async = require("async");
const crypto = require('crypto');
sgMail.setApiKey(process.env.SENDGRID_API_KEY); //Stored in the *.env file.
//sgMail.setApiKey('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');
//process.env.SENDGRID_API_KEY = "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";
const MongoClient = require("mongodb").MongoClient;
const ObjectId = require("mongodb").ObjectId;
const URL = process.env.MONGODB_URI, BASE = process.env.BASE;

exports.getIndex = (req, res) => {
  if (!req || !req.session) return false;
  const supplier = req.session.supplier;

  BidRequest.find({ supplier: supplier._id })
    .then(requests => {
      const requestsCount = requests.length;

      res.render("supplier/index", {
        supplier: supplier,
        requestsCount: requestsCount,
        successMessage: req.flash("success")
      });
    })
    .catch(console.error);
}


exports.getAddProduct = (req, res) => {
  res.render("supplier/addProduct", {
    supplierId: req.session.supplier._id
  });
}


exports.postAddProduct = (req, res) => {
  if (!req.body.productPrice) {
    console.error("Price is not valid, please correct it.");
    res.redirect("back");
  } else {
    const product = new ProductService({
      supplier: req.body._id,
      productName: req.body.productName,
      price: parseFloat(req.body.price),
      currency: req.body.currency ? req.body.currency : "EUR",
      createdAt: Date.now(),
      updatedAt: Date.now()
    });

    product
      .save()
      .then(() => {
        req.flash("success", "Product added successfully!");
        return res.redirect("/supplier/profile");
      })
      .catch(console.error);
  }
}


exports.postCancelBid = (req, res) => {
  //BidRequest.findOne({_id: req.params.bidId});
  MongoClient.connect(URL, function(err, db) {
      if (err) 
        throw err;
    
      var dbo = db.db(BASE);
      var myquery = { _id: new ObjectId(req.body.bidId) };
      var newvalues = { $set: {isCancelled: true, status: parseInt(process.env.SUPP_BID_CANCEL)} };
      dbo.collection("bidrequests").updateOne(myquery, newvalues, function(err, resp) {
        if(err) {
          console.error(err.message);
          
          return res.status(500).send({ 
            msg: err.message 
          });         
        }

        db.close();
        var mailOptions = {
          from: "peter@uniteprocurement.com",
          to: req.body.buyersEmail,
          subject: "Bid request " + req.body.requestsName + " cancelled!",
          text:
            "Hello " + req.body.buyersName + 
            ",\n\nWe regret to inform you that your outgoing Order named " + req.body.requestsName + " has been cancelled by "
            + "the Supplier " + req.body.suppliersName + ".\nPlease contact the Supplier at " + req.body.suppliersEmail + " for more"
            + " details.\nUNITE apologizes for any inconvenience that this issue may have caused to you."+ "\n\n"
            + "Sincerely,\nThe UNITE Public Procurement Platform Staff"
        };

        sgMail.send(mailOptions, function(err) {
          if(err) {
            return res.status(500).send({ msg: err.message });
          }
          
          var msg = "The Bid Request has been cancelled by Supplier " + req.body.suppliersName + '.\n' + 'Buyer ' + req.body.buyersName + ' has been notified via e-mail about the Order cancellation.';
          console.log(msg);
          req.flash(msg);
          res.status(200).send(msg);
          //res.redirect('/supplier/bid-requests');
        });
      });
    });
}


exports.getConfirmation = (req, res) => {
  if(!req.session || !req.session.supplierId) {req.session.supplierId = req.params.token? req.params.token._userId : null}
  res.render("supplier/confirmation", {
    token: req.params.token });
}


exports.getResendToken = (req, res) => {
  res.render("supplier/resend");
}


exports.postConfirmation = function(req, res, next) {
  //assert("token", "Token cannot be blank").notEmpty();
  //req.sanitize("emailAddress").normalizeEmail({ remove_dots: false });
  //var errors = req.validationErrors();
  //if (errors) return res.status(400).send(errors);  

  Token.findOne({ token: req.params.token }, function(err, token) {
    if (!token) {
      req.flash(
        "We were unable to find a valid token. It may have expired. Please request a new confirmation token."
      );
      
      if(1==2)
        return res.status(400).send({
          type: "not-verified",
          msg:
            "We were unable to find a valid token. Your token may have expired."
        });
      
      res.redirect("/supplier/resend");
    }
  
    Supplier.findOne({ _id: token._userId, emailAddress: req.body.emailAddress }, function (err, user) {
            if (!user) 
              return res.status(400).send({
              msg: 'We were unable to find a user for this token.' 
            });
          
            if (user.isVerified) 
              return res.status(400).send({ 
              type: 'already-verified', 
              msg: 'This user has already been verified.' });           
          
            MongoClient.connect(URL, function(err, db) {//db or client.
                  if (err) throw err;
                  var dbo = db.db(BASE);
                  var myquery = { _id: user._id };
                  var newvalues = { $set: {isVerified: true} };
                  dbo.collection("suppliers").updateOne(myquery, newvalues, function(err, resp) {
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
                    if(res) res.status(200).send("The account has been verified. Please log in.");
                  });
                });
          /*
            user.isVerified = true;
            user.save(function (err) {
              if (err) {                
              }              
            });*/
        });
  });
}


exports.postResendToken = function(req, res, next) {
  Supplier.findOne({ emailAddress: req.body.emailAddress }, function(err, user) {
    if (!user)
      return res
        .status(400)
        .send({ msg: "We were unable to find a user with that email." });
    if (user.isVerified)
      return res.status(400).send({
        msg: "This account has already been verified. Please log in."
      });

    // Create a verification token, save it, and send email
    var token = new Token({
      _userId: user._id,
      token: crypto.randomBytes(16).toString("hex")
    });

    // Save the token
    token.save(function(err) {
      if (err) {
        return res.status(500).send({ msg: err.message });
      }

      var mailOptions = {
        from: "peter@uniteprocurement.com",
        to: user.emailAddress,
        subject: "Account Verification Token - Resent",
        text:
          "Hello,\n\n" +
          "Please verify your account within 24 hours, by clicking the link: \nhttp://" +
          req.headers.host +
          "/supplier/confirmation/" +
          token.token +
          "\n"
      };

      sgMail.send(mailOptions, function(err, info) {
        if(err) {
          return res.status(500).send({ msg: err.message });
        }
        res
          .status(200)
          .send(
            "A verification email has been sent to " + user.emailAddress + ". Please check your e-mail."
          );
      });
    });
  });
}


exports.getSignIn = (req, res) => {
  if (!req.session.supplierId) {
    return res.render("supplier/sign-in", {
      errorMessage: req.flash("error")
    });
  } else res.redirect("/supplier");
}


exports.postSignIn = (req, res) => {
  const email = req.body.emailAddress;
  const password = req.body.password;
  console.log(email + ' ' + password);
  /*
  const msg = {
  from: 'peter@uniteprocurement.com',
  to: 'peter.minea@gmail.com',
  subject: 'CHENECCO',
  text: 'NODE.JS MAILER SEND',
  html: '<strong>And easy to do anywhere, even with Node.js that is NOT Java.</strong>',
};
sgMail.send(msg);*/

  if (!email) 
    res.redirect("/supplier/sign-in");
  else {
    Supplier.findOne(
      { 
      emailAddress: email,
      password: password 
      },
      (err, doc) => {
        if(err) return console.error(err.message);

        if (!doc) {
          req.flash("error", "Invalid e-mail address or password.");
          return res.redirect("/supplier/sign-in");
        }

        try {
          bcrypt
          .compare(password, doc.password)
          .then((doMatch) => {
            if (
              doMatch ||
              (password === doc.password && email === doc.emailAddress)
            ) {
              req.session.supplier = doc;
              req.session.supplierId = doc._id;

              // Make sure the user has been verified
              if (!doc.isVerified)
                return res.status(401).send({
                  type: "not-verified",
                  msg:
                    "Your account has not been verified. Please check your e-mail for instructions."
                });

              req.session.cookie.originalMaxAge = req.body.remember? null : 7200000;//Two hours.
              return req.session.save();
            } else {
              req.flash("error", "Passwords and e-mail do not match!");
              res.redirect("/supplier/sign-in");
            }
          })
          .then((err) => {
            if (err) {
              console.error(err);
              res.redirect("/supplier/sign-in");
            }

            res.redirect("/supplier");
          })
          .catch(console.error);
        } catch {
          res.redirect("/supplier/sign-in")
        }       
      });
  }
}

exports.getSignUp = (req, res) => {
  if (!req.session.supplier)
    return res.render("supplier/sign-up", {
      errorMessage: req.flash("error")
    });
  else res.redirect("/supplier");
};


function prel(req, isNumber) {
  var arr = (req);
  arr = arr.split(',');
  var newProd = [];
  for (var i in arr) {
    newProd.push(isNumber? parseInt(arr[i]) : String(arr[i]));
    }  
  
  return newProd;
}


let global = 0;
exports.postSignUp = (req, res) => {
  if (req.body.emailAddress) {
    const email = req.body.emailAddress;
    const email_str_arr = email.split("@");
    const domain_str_location = email_str_arr.length - 1;
    const final_domain = email_str_arr[domain_str_location];
    var prohibitedArray = [
      "gmail.com",
      "hotmail.com",
      "outlook.com",
      "yandex.com",
      "yahoo.com",
      "gmx"
    ];

    for (var i = 0; i < prohibitedArray.length; i++)
      if (final_domain.toLowerCase().includes(prohibitedArray[i].toLowerCase())) {
        req.flash("error", "E-mail address must belong to a custom company domain.");
        res.redirect("back"); //supplier/sign-up
      } else {
        if (req.body.password.length < 6) {
          req.flash("error", "Password must have at least 6 characters.");
          res.redirect("back");
          var supplier;
          //Prevent duplicate attempts:
        } else if (global++ < 1) {
          // Make sure this account doesn't already exist
          Supplier.findOne({ emailAddress: req.body.emailAddress }, function(err,  user) {
            if (user)
              return res.status(400).send({
                msg:
                  "The e-mail address you have entered is already associated with another account."
              });
          try {
            bcrypt.hash(req.body.password, 10, function(err, hash) {
              //user = new Promise((resolve, reject) => {
                supplier = new Supplier({
                  companyName: req.body.companyName,
                  directorsName: req.body.directorsName,
                  contactName: req.body.contactName,
                  title: req.body.title,
                  companyRegistrationNo: req.body.companyRegistrationNo,
                  emailAddress: req.body.emailAddress,
                  password: req.body.password,
                  isVerified: false,
                  registeredCountry: req.body.registeredCountry,
                  companyAddress: req.body.companyAddress,
                  areaCovered: req.body.areaCovered,
                  contactMobileNumber: req.body.contactMobileNumber,
                  country: req.body.country,
                  industry: req.body.industry,
                  employeeNumbers: req.body.employeeNumbers,
                  lastYearTurnover: req.body.lastYearTurnover,
                  website: req.body.website,
                  productsServicesOffered: prel(req.body.productsServicesOffered),
                  pricesList: prel(req.body.pricesList, true),
                  currenciesList: prel(req.body.currenciesList),
                  capabilityDescription: req.body.capabilityDescription,
                  relevantExperience: req.body.relevantExperience,
                  supportingInformation: req.body.supportingInformation,
                  certificates: req.body.certificates,
                  antibriberyPolicy: req.body.antibriberyPolicy,
                  environmentPolicy: req.body.environmentPolicy,
                  qualityManagementPolicy: req.body.qualityManagementPolicy,
                  occupationalSafetyAndHealthPolicy: req.body.occupationalSafetyAndHealthPolicy,
                  otherRelevantFiles: req.body.otherRelevantFiles,
                  balance: req.body.balance,
                  facebookURL: req.body.facebookURL,
                  instagramURL: req.body.instagramURL,
                  twitterURL: req.body.twitterURL,
                  linkedinURL: req.body.linkedinURL,
                  otherSocialMediaURL: req.body.otherSocialMediaURL,
                  UNITETermsAndConditions: true,//We assume that user was constrainted to check them.
                  antibriberyAgreement: true,
                  createdAt: Date.now(),
                  updatedAt: Date.now()
                });

                supplier.save((err) => {
                  if (err) {
                    //req.flash('error', err.message);
                    console.error(err);
                     return res.status(500).send({
                         msg: err.message
                         });
                    //reject(new Error("Error with exam result save... " + err));
                  }
                  
                  req.session.supplier = supplier;
                  req.session.id = supplier._id;
                  req.session.save();

                  if (Array.isArray(supplier.productsServicesOffered)) {
                    for (var i in supplier.productsServicesOffered) {
                      var productService = new ProductService({
                        supplier: supplier._id,
                        productName: supplier.productsServicesOffered[i],
                        price: parseFloat(supplier.pricesList[i]),
                        currency: supplier.currenciesList[i],
                        createdAt: Date.now(),
                        updatedAt: Date.now()
                      });

                      productService.save((err) => {
                        if (err) {
                          req.flash('error', err.message);
                          console.error(err.message);
                        }
                      });
                    }
                  }

                  var capability = new Capability({
                    supplier: supplier._id,
                    capabilityDescription: supplier.capabilityDescription,
                    createdAt: Date.now(),
                    updatedAt: Date.now()
                  });

                  capability.save(function(err) {
                    if(err) {
                      console.error(err.message);
                      }
                  });

                  // Create a verification token for this user
                  var token = new Token({
                    _userId: supplier._id,
                    token: crypto.randomBytes(16).toString("hex")
                  });

                  // Save the verification token
                  token.save(function(err) {
                    if (err) {
                      console.error(err.message);
                      return res.status(500).send({
                       msg: err.message
                       });
                    }

                    var email = {
                      from: "peter@uniteprocurement.com",
                      to: supplier.emailAddress,//'peter.minea@gmail.com'
                      subject: "Account Verification Token",
                      text:
                        "Hello " + supplier.companyName +
                        ",\n\nCongratulations for registering on the UNITE Public Procurement Platform!\n\nPlease verify your account by clicking the link: \nhttp://" 
                      + req.headers.host + "/supplier/confirmation/" + token.token + "\n"
                    };

                    sgMail.send(email, function(err, info) {
                      if (err) {
                        console.error(err);
                        //res.redirect('back');
                        //return res.status(500).send({
                        // msg: err.message
                        // });
                      }
                      
                      console.log("A verification email has been sent to " +  supplier.emailAddress + ".");
                      req.flash("success", "A verification email has been sent to " +
                          supplier.emailAddress + ". Please check your e-mail.");
                      //return res.status(200).send('A verification email has been sent to ' + supplier.emailAddress + '. Please check your e-mail.');
                    });
                  });
                })/*;
                assert.ok(user instanceof Promise);
                user*/
                });
            } catch {
              res.redirect('/supplier/sign-up');
            }
              })
                  .then((doc) => {
                  })
                  .then(() => {
                    req.flash("success", "Supplier signed up successfully!");
                    if (res)
                      res.redirect("/supplier");
                  })
                  .catch(console.error);
                
                //resolve(supplier);
              //});
            //});
          //});
        }
      }
  }
}


exports.getForgotPassword = (req, res) => {
  res.render("supplier/forgotPassword", {
    email: req.session.supplier.emailAddress
  });
}


exports.getChat = (req, res) => {
  res.render("supplier/chat", {
    from: req.params.supplierId,
    to: req.params.buyerId,
    fromName: req.params.supplierName,
    toName: req.params.buyerName,
    reqId: req.params.requestId,
    reqName: req.params.requestName
  });
}


exports.postForgotPassword = (req, res, next) => {
  async.waterfall(
    [
      function(done) {
        crypto.randomBytes(20, function(err, buf) {
          var token = buf.toString("hex");
          done(err, token);
        });
      },
      function(token, done) {
        Supplier.findOne({ emailAddress: req.body.emailAddress }, function (err, user) {
          if (!user) {
            req.flash('error', 'Sorry. We were unable to find a user with this e-mail address.');
            return res.redirect('supplier/forgotPassword');
          }

          MongoClient.connect(URL, function(err, db) {
            if (err) throw err;
            var dbo = db.db(BASE);
            var myquery = { _id: user._id };
            var newvalues = { resetPasswordToken: token, resetPasswordExpires: Date.now() + 86400000};
            dbo.collection("suppliers").updateOne(myquery, newvalues, function(err, res) {        
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
          from: "peter@uniteprocurement.com",
          to: user.emailAddress,
          subject: "UNITE Password Reset - Supplier",
          text:
            "Hello,\n\n" +
            "You have received this e-mail because you requested a Supplier password reset on our UNITE platform." +
            " Please reset your password within 24 hours, by clicking the link: \nhttp://" + req.headers.host + "/supplier/reset/" + token + "\n"
        };

        sgMail.send(emailOptions, function(err, info) {
          console.log("E-mail sent!");
          req.flash(
            "success",
            "An e-mail has been sent to " +
              user.emailAddress +
              " with password reset instructions. Please check your e-mail."
          );
          done(err, "done");
        });
      }
    ],
    function(err) {
      if (err) return next(err);
      res.redirect("/supplier/forgotPassword");
    }
  );
};

exports.getResetPasswordToken = (req, res) => {
  Supplier.findOne({
      resetPasswordToken: req.params.token,
      resetPasswordExpires: { $gt: Date.now() }
    },
    function(err, user) {
      if (!user) {
        req.flash(
          "error",
          "Password reset token is either invalid or expired."
        );
        return res.redirect("supplier/forgotPassword");
      }
      res.render("supplier/resetPassword", { token: req.params.token });
    }
  );
};

exports.postResetPasswordToken = (req, res) => {
  async.waterfall([
    function(done) {
      Supplier.findOne({resetPasswordToken: req.params.token, 
                     resetPasswordExpires: { $gt: Date.now() }
                    }, function(err, user) {
      if(!user) {
        req.flash('error', 'Password reset token is either invalid or expired.');
        return res.redirect('back');
      }
        
    if(req.body.password === req.body.confirm) {
        MongoClient.connect(URL, function(err, db) {
          if (err) throw err;
          var dbo = db.db(BASE);
          var myquery = { _id: user._id };
          var newvalues = { password: req.body.password, resetPasswordToken: undefined, resetPasswordExpires: undefined};
          dbo.collection("suppliers").updateOne(myquery, newvalues, function(err, res) {        
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
          from: "no-reply@uniteprocurement.com",
          to: user.emailAddress,
          subject: "UNITE Password changed - Supplier",
          text:
            "Hello,\n\n" +
            "You have successfully reset your Supplier password on our UNITE platform" +
            " for the account registered with " + user.emailAddress + ". You can log in again."
        };

        sgMail.send(emailOptions, function(err, info) {
          console.log("E-mail sent!");
          req.flash("success", "Your password has been successfully changed!");
          done(err, "done");
        });
      }
    ],
    function(err) {
      res.redirect("/supplier");
    }
  );
}


exports.getProfile = (req, res) => {
  if (!req || !req.session) return false;
  const supplier = req.session.supplier;

  ProductService.find({ supplier: supplier._id })
    .then( (products) => {
      req.session.supplier.productsServicesOffered = [];
    
      for(var i in products) {
        req.session.supplier.productsServicesOffered.push(products[i].productName);
      }
    
      res.render("supplier/profile", {
        products: products,
        profile: req.session.supplier
      });
    })
    .catch(console.error);
}


exports.getBidRequests = (req, res) => {
  const supplier = req.session.supplier;

  BidRequest.find({ supplier: supplier._id })
    .then(requests => {
      res.render("supplier/bid-requests", {
        supplier: supplier,
        requests: requests
      });
    })
    .catch(console.error);
};

exports.getBalance = (req, res) => {
  res.render("supplier/balance", { balance: req.session.supplier.balance });
}


exports.getBidRequest = (req, res) => {
  const supplier = req.session.supplier;
  let request;
  const id = req.params.id;

  BidRequest.findOne({ _id: id })
    .then( (reqresult) => {
      request = reqresult;
      return Buyer.findOne({ _id: request.buyer });
    })
    .then((buyer) => {
    var promise = BidStatus.find({}).exec();
    promise.then((statuses) => {
      res.render("supplier/bid-request", {
        supplier: supplier,
        request: request,
        buyer: buyer,
        statuses: statuses
        });
      });
    })
    .catch(console.error);
}


exports.postBidRequest = (req, res) => {
  MongoClient.connect(URL, function(err, db) {
    if (err) throw err;
    var dbo = db.db(BASE);
    var myquery = { _id: req.body.reqId };
    var newvalues = { $set: {status: req.body.status} };
    dbo.collection("bidrequests").updateOne(myquery, newvalues, function(err, res) {
      if(err) {
        console.error(err.message);
        return false;
      }
      req.flash('success', 'Bid status updated successfully!');

      if(req.body.message) {
        const newMessage = new Message({
          to: req.body.to,
          from: req.body.from,
          sender: req.body.sender,
          receiver: req.body.receiver,
          bidRequestId: req.body.reqId,
          message: req.body.message
        });

        newMessage
          .save()
          .then( (err, result) => {
            if(err) {
              console.error(err.message);        
            }

            req.flash('', 'Message sent to Supplier!');
        })
          .catch(console.error);              
      }
    });
    res.redirect("back");
  });
  //req.originalUrl  
 }



exports.postProfile = (req, res) => {
  Supplier.findOne({ _id: req.body._id }, (err, doc) => {
    if (err) {
      console.error(err);
      res.redirect("back");
    }

    doc._id = req.body._id;
    doc.companyName = req.body.companyName;
    doc.directorsName = req.body.directorsName;
    doc.contactName = req.body.contactName;
    doc.title = req.body.title;
    doc.emailAddress = req.body.emailAddress;
    doc.password = req.body.password;
    doc.isVerified = req.body.isVerified;
    doc.companyRegistrationNo = req.body.companyRegistrationNo;
    doc.registeredCountry = req.body.registeredCountry;
    doc.balance = req.body.balance;
    doc.companyAddress = req.body.companyAddress;
    doc.areaCovered = req.body.areaCovered;
    doc.contactMobileNumber = req.body.contactMobileNumber;
    doc.country = req.body.country;
    doc.industry = req.body.industry;
    doc.employeeNumbers = req.body.employeeNumbers;
    doc.lastYearTurnover = req.body.lastYearTurnover;
    doc.website = req.body.website;    
    doc.productsServicesOffered = prel(req.body.productsServicesOffered);
    doc.pricesList = prel(req.body.pricesList);
    doc.currenciesList = prel(req.body.currenciesList);
    doc.capabilityDescription = req.body.capabilityDescription;
    doc.relevantExperience = req.body.relevantExperience;
    doc.supportingInformation = req.body.supportingInformation;
    doc.certificates = req.body.certificates;
    doc.antibriberyPolicy = req.body.antibriberyPolicy;
    doc.environmentPolicy = req.body.environmentPolicy;
    doc.qualityManagementPolicy = req.body.qualityManagementPolicy;
    doc.occupationalSafetyAndHealthPolicy = req.body.occupationalSafetyAndHealthPolicy;
    doc.otherRelevantFiles = req.body.otherRelevantFiles;
    doc.facebookURL = req.body.facebookURL;
    doc.instagramURL = req.body.instagramURL;
    doc.twitterURL = req.body.twitterURL;
    doc.linkedinURL = req.body.linkedinURL;
    doc.otherSocialMediaURL = req.body.otherSocialMediaURL;
    doc.UNITETermsAndConditions = req.body.UNITETermsAndConditions == "on" ? true : false;
    doc.antibriberyAgreement = req.body.antibriberyAgreement == "on" ? true : false;
    doc.createdAt = req.body.createdAt;
    doc.updatedAt = Date.now();
    //doc.__v = 1;//Last saved version. To be taken into account for future cases of concurrential changes, in case updateOne does not protect us from that problem.
    var price = req.body.price;
    
    MongoClient.connect(URL, function(err, db) {
      if (err) throw err;
      var dbo = db.db(BASE);
      var myquery = { _id: doc._id };
      var newvalues = { $set: doc };
      dbo
        .collection("suppliers")
        .updateOne(myquery, newvalues, function(err, res) {
          if (err) {
            console.error(err.message);
            return false;
          }

          console.log("One document updated!");
          var arr = doc.productsServicesOffered;
          var query = {supplier: doc._id};
        
          dbo.collection("productservices").deleteMany(query, (err, res) => {
            if(err) console.log(err.message);
          });

          if (Array.isArray(arr))
            for (var i in arr) {
              var productService = new ProductService({
                supplier: doc._id,
                productName: arr[i],
                price: parseFloat(doc.pricesList[i]),
                currency: doc.currenciesList[i],
                createdAt: Date.now(),
                updatedAt: Date.now()
              });

              productService.save(err => {
                if (err) {
                  console.error(err.message);
                }
              });
            }

        console.log('Products offered list saved!');
        dbo.collection("capabilities").deleteMany(query, (err, res) => {
            if(err) console.log(err.message);
          });
        
          var capability = new Capability({
            supplier: doc._id,
            capabilityDescription: doc.capabilityDescription,
            createdAt: Date.now(),
            updatedAt: Date.now()
          });

          capability.save(err => {
            if (err) {
              console.error(err.message);
            }
          });
        
          console.log('Capability description also saved!');
          db.close();
        });
    });
  })
    .then(doc => {
      console.log("Saving new data to session:");
      req.session.supplier = doc;
      req.session.id = doc._id;
      return req.session.save();
    })
    .then(() => {
      console.log("User updated!");
      req.flash("success", "Supplier details updated successfully!");
      return res.redirect("/supplier");
    })
    .catch(console.error);
};
