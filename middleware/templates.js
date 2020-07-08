const sgMail = require('@sendgrid/mail');
const MongoClient = require('mongodb').MongoClient;
const bcrypt = require("bcryptjs");

sgMail.setApiKey(process.env.SENDGRID_API_KEY);
const URL = process.env.MONGODB_URI, BASE = process.env.BASE;
const treatError = require('../middleware/treatError');
const captchaSecretKey = process.env.RECAPTCHA_V2_SECRET_KEY;
const fetch = require('node-fetch');

const sendConfirmationEmail = (name, link, token, req) => {
    sgMail.send({
      from: 'peter@uniteprocurement.com',
      to: req.body.emailAddress, 
      subject: 'Account Verification Token',
      text: `Hello ${name},\n\nCongratulations for registering on the UNITE Public Procurement Platform!\n\nPlease verify your account by clicking the link: \nhttp://${req.headers.host}${link}${token}\n`
    }, function (err, resp) {
       if (err ) {
        console.error(err.message);         
         throw err;
      }

      console.log('A verification email has been sent to ' + req.body.emailAddress  + '.');
      req.flash('success', 'A verification email has been sent to ' + req.body.emailAddress + '.\n');
    });
};


const prel = (req, isFloat, isInt) => {
  var arr = (req);
  arr = arr.split(',');
  var newProd = [];
  for (var i in arr) {
    newProd.push(isFloat? parseFloat(arr[i]).toFixed(2) : isInt? parseInt(arr[i]) : String(arr[i]));
    }
  
  return newProd;
}


const sortLists = (productList, amountList, priceList, imagesList, currenciesList) => {
  var arr = [], arr2 = [], arr3 = [], arr4 = [], arr5 = [];
  
  for(var i in productList) {
    arr.push(productList[i]);
  }
  
  arr.sort();
  
  for(var i in arr) {
    for(var j in productList) {
      if(arr[i] == productList[j]) {
        arr2.push(amountList[j]);
        arr3.push(priceList[j]);
        arr4.push(imagesList[j]);
        if(currenciesList)
            arr5.push(currenciesList[j]);
        break;
      }
    }
  }
  
  for(var i in productList) {
    productList[i] = arr[i];
    amountList[i] = arr2[i];
    priceList[i] = arr3[i];
    imagesList[i] = arr4[i];
    if(currenciesList)
      currenciesList[i] = arr5[i];
  }
}


const sendCancellationEmail = (type, req, data, reason) => {//Buyer: placed orders, sent/received messages
  sgMail.send({
    from: 'peter@uniteprocurement.com',
    to: req.body.emailAddress, 
    subject: `UNITE - ${type} Account Deletion Completed`,
    text: 
      `Hello ${req.body.organizationName},\n\nWe are sorry to see you go from the UNITE Public Procurement Platform!\n\nYour ${type} account has just been terminated and all your data such as ${data} and any user tokens saved by you have also been lost.\nWe hope to see you back in the coming future. If you have improvement suggestions for us, please send them to our e-mail address above.\n\nWith kind regards,\nThe UNITE Public Procurement Platform Team`,
    html: reason? '<p style="color: brown; font-size: 12pt; font-weight: bold italic; word-wrap: break-word; font-face: arial"><br>' + reason + '</p>' : null
  }, function (err, resp) {
     if (err ) {
      return console.log(err.message);
    }

      console.log('A termination confirmation email has been sent to ' + req.body.emailAddress + '.');
      req.flash('success', 'A termination confirmation email has been sent to ' + req.body.emailAddress + '.\n' + `${type} account finished off successfully!`);
    });
};


const sendCancelBidEmail = (req, victim, actor, victimMail, actorMail, victimType, actorType, reason) => {
        sgMail.send({
          from: "peter@uniteprocurement.com",
          to: victimMail,
          subject: "Bid request " + req.body.requestsName + " cancelled!",
          text:
            "Hello " + victim + 
            ",\n\nWe regret to inform you that your incoming Order named " + req.body.requestsName + " has been cancelled by "
            + "the " + actorType + actor + ".\nPlease contact them at " + actorMail + " for more"
            + " details.\nUNITE apologizes for any inconvenience that this issue may have caused to you. We will refund the Buyer's balance within a few working days."+ "\n\n"
            + "With kind regards,\nThe UNITE Public Procurement Platform Team",
            html: reason? '<p style="color: fuchsia; font-size: 12pt; font-weight: bold italic; word-wrap: break-word; font-face: arial"><br>' + reason + '</p>' : null
          }, function(err) {
            if(err) {
              return console.log(err.message);
            }
          
          var msg = "The Bid Request has been cancelled by the " + actorType + actor + '.\n' + victimType + victim + ' has been notified via e-mail about the Order cancellation.';
          console.log(msg);
          req.flash('success', msg);
      });
};


function sendExpiredBidEmail(req, bid, mail, name, type) {
        sgMail.send({
          from: "peter@uniteprocurement.com",
          to: mail,
          subject: "Bid request " + bid.requestName + " expired!",
          text:
            "Hello " + name + 
            ",\n\nWe regret to inform you that your " + type + " Order named " + bid.requestName + " has expired.\n"
            + "Its expiration date was " + bid.expiryDateFormatted + ".\n"
            + `The bid was sent by ${bid.buyerName} to ${bid.supplierName}, on ${bid.createdAtFormatted}.\n\n`
            + "UNITE apologizes for any inconvenience that this issue may have caused to you. You can remove the expired bid from your profile in case you have not obtained a prolongation letter."+ "\n\n"
            + "With kind regards,\nThe UNITE Public Procurement Platform Team"
          }, function(err) {
            if(err) {
              console.log(err.message);
              req.flash('error', err.message);
              return false;
            }
          
          req.flash('success', `Expiry notification about the Bid Request ${bid.requestName} successfully sent to ${mail}!`);
      });
};


const sendInactivationEmail = (type, req, data, reason) => {
  sgMail.send({
    from: 'peter@uniteprocurement.com',
    to: req.body.emailAddress, 
    subject: `UNITE - ${type} Account Inactivated`,
    text: 
      `Hello ${req.body.organizationName},\n\nYour ${type} account on the UNITE Public Procurement Platform has been inactivated. Some specific data such as ${data} has been deleted from our records. You will be active again at the next login on the Platform. \n\n.We hope to see you back soon. Please remember that your active presence on UNITE means a helping hand to others.\n\nIf you have improvement suggestions for us, please send them to our e-mail address above.\n\nWith kind regards,\nThe UNITE Public Procurement Platform Team`,
    html: reason? '<p style="color: brown; font-size: 12pt; font-weight: bold italic; word-wrap: break-word; font-face: arial"><br>' + reason + '</p>' : null
  }, function (err, resp) {
     if (err ) {
      return console.log(err.message);
    }

      console.log('An email about the account inactivation has been sent to ' + req.body.emailAddress + '.');
      req.flash('success', 'An email about the account inactivation has been sent to ' + req.body.emailAddress + '.\n' + `${type} account inactivated successfully!`);
    });
};


const resendTokenEmail = (user, token, link, req) => {
  sgMail.send({
    from: 'peter@uniteprocurement.com',
    to: user.emailAddress,
    subject: 'Account Verification Token',
    text: "Hello,\n\n" +
          "Please verify your account by clicking the link: \nhttp://" +
          req.headers.host + link + token +
          "\n" }, function (err, info) {
       if (err ) {
        console.log(err);
      }  else {
        console.log('Message sent: ' + info.response);                
      }
      if (err) {
        return console.error(err.message);
      }
        
        req.flash('success', 'A verification email has been sent to ' + user.emailAddress + '.');      
      });  
};


const sendForgotPasswordEmail = (user, type, link, token, req) => {
      sgMail.send({
        from: 'peter@uniteprocurement.com',
        to: user.emailAddress, 
        subject: 'UNITE Password Reset - ' + type, 
        text:
            "Hello,\n\n" +
            "You have received this e-mail because you requested a Supervisor password reset on our UNITE platform." +
            " Please reset your password within 24 hours, by clicking the link: \nhttp://" + req.headers.host + link + token + "\n"
        }, function (err, resp) {
        if(err)
          return console.error(err.message);
        console.log('E-mail sent!')
        req.flash('success', 'An e-mail has been sent to ' + user.emailAddress + ' with password reset instructions.');
      });
};


const sendResetPasswordEmail = (user, type, req) => {
      sgMail.send({
        from: 'peter@uniteprocurement.com',
        to: user.emailAddress, 
        subject: 'UNITE Password changed - ' + type, 
        text: 'Hello,\n\n' 
        + 'You have successfully reset your '+ type + ' password on our UNITE platform'
        + 'for the account registered with ' + user.emailAddress + '. You can log in again.'        
      }, function (err, resp) {
        if(err)
          return console.error(err.message);
        console.log('E-mail sent!')
        req.flash('success', 'Your password has been successfully changed!');        
      });
};


const postSignInBody = async (link, req, res) => {
  var dbLink = link + 's';
  const email = req.body.emailAddress;
  const password = req.body.password;
  console.log(email + ' ' + password);
  const captchaVerified = await fetch('https://www.google.com/recaptcha/api/siteverify?secret=' + captchaSecretKey + '&response=' + req.body.captchaResponse, {method: 'POST'})
  .then((res0) => res0.json());
  
  console.log((req.body.captchaResponse).length);
  console.log(captchaVerified);
  if(((req.body.captchaResponse).length == 0) || captchaVerified.success === true) {//The 0 length means that we are inside the development environment, and not on the domain itself (platform.uniteprocurement.com). This applies only to us developers :) .
    try {
    if(!email) {
      req.flash('error', 'No e-mail was given!');
      return res.redirect(`/${link}/sign-in`);
    }
    else {
       MongoClient.connect(URL, {useUnifiedTopology: true},  function(err, db) {
        if(treatError(req, res, err, `/${link}/sign-in`)) 
          return false;

        var dbo = db.db(BASE);
        console.log(dbLink);
         dbo.collection(dbLink).findOne( { emailAddress: email} ,  (err, doc) => {
          if(err) 
            return console.error(err.message);

          if(!doc) {
            req.flash("error", "Invalid e-mail address or password!");
            return res.redirect(`/${link}/sign-in`);
          }
            switch(link) {
              case 'buyer':
                req.session.buyer = doc;
                req.session.buyerId = doc._id;
                break;

              case 'supervisor':
                req.session.supervisor = doc;
                req.session.supervisorId = doc._id;
                break;

              case 'supplier':
                req.session.supplier = doc;
                req.session.supplierId = doc._id;
                break;

              default:
                break;
            }

            req.session.cookie.originalMaxAge = req.body.remember? null : 7200000;//Two hours.           
            req.session.save();
            bcrypt.compare(password, doc.password, async (err, doMatch) => {
              if(treatError(req, res, err, `/${link}/sign-in`))
                return false;

              if (doMatch ||
                (password === doc.password && email === doc.emailAddress)
              ) {
                if (!doc.isVerified)
                  return res.status(401).send({
                    type: "not-verified",
                    msg:
                      "Your account has not been verified. Please check your e-mail for instructions."
                  });

                  if(doc.isActive != null && doc.isActive == false) {//Reactivate on login.
                      if(link == 'buyer') {
                        await dbo.collection('supervisors').findOne({ organizationUniteID: doc.organizationUniteID }, async function(err, obj) {
                          if(treatError(req, res, err, `/${link}/sign-in`))
                            return false;
                          if(!obj || !obj.isActive) {
                            return res.status(401).send({
                              type: "not-valid-supervisor",
                              msg: "You do not currently have a valid and/or active Supervisor. Please check with them before reactivating your Buyer account."});
                          } else
                              await dbo.collection(dbLink).updateOne( { _id: doc._id }, { $set: { isActive: true } }, function(err, obj) {
                                if(treatError(req, res, err, `/${link}/sign-in`))
                                  return false;
                              });
                        });
                      } else                  
                        await dbo.collection(dbLink).updateOne( { _id: doc._id }, { $set: { isActive: true } }, function(err, obj) {
                          if(treatError(req, res, err, `/${link}/sign-in`))
                            return false;
                        });
                  }

                  db.close();
                console.log(`/${link}`);
                  setTimeout(function() {
                    return res.redirect(`/${link}`);
                  }, 500);
              } else {
                req.flash("error", "Passwords and e-mail do not match!");
                return res.redirect(`/${link}/sign-in`);
              }
            })
          })
        })//.catch(console.error);;
      }
    } catch {
    }
  } else {
      req.flash('error', 'Captcha failed!')
      res.redirect('back');
  }
};


const sendExpiredBidEmails = (req, res, expiredBids) => {
  if(expiredBids.length) {
    for(var i in expiredBids) {
      if(expiredBids[i].isExpired == false) {
        MongoClient.connect(URL, {useUnifiedTopology: true}, function(err, db) {//db or client.
          if(treatError(req, res, err, 'back'))
            return false;

          var dbo = db.db(BASE);
          dbo.collection("bidrequests").updateOne({ _id: expiredBids[i]._id }, { $set: {isExpired: true} }, function(err, resp) {
            sendExpiredBidEmail(req, expiredBids[i], expiredBids[i].buyerEmail, expiredBids[i].buyerName, 'outgoing');
            sendExpiredBidEmail(req, expiredBids[i], expiredBids[i].supplierEmail, expiredBids[i].supplierName, 'incoming');
          });
        });
      }
    }
  }
};

const { basicFormat, customFormat, normalFormat } = require('../middleware/dateConversions');

const updateBidBody = (req, res, reqId, returnLink) => {
  MongoClient.connect(URL, { useUnifiedTopology: true }, async function(err, db) {
    if (treatError(req, res, err, "back")) 
      return false;    

    var dbo = db.db(BASE);
    
    var bid = await dbo.collection("bidrequests").findOne({ _id: reqId }, function(err, bid) {
      if (treatError(req, res, err, "back") || !bid) 
        return false;
      var values;
      
      if(!bid.isExpired && !bid.isExtended && bid.validityExtensionId) {
        var extDuration = process.env.DAYS_BID_EXTENDED * process.env.DAY_DURATION;
        var newDate = bid.expiryDate + extDuration;
        var newDateFormatted = customFormat(newDate);
        values = { $set: { isExtended: true, expiryDate: newDate, expiryDateFormatted: newDateFormatted, status: req.body.status } };
      } else {
        values = { $set: { status: req.body.status } };
      }
      
      dbo
      .collection("bidrequests")
      .updateOne(
        { _id: reqId },
        values,
        function(err, resp) {
          if (treatError(req, res, err, "back")) 
            return false;
          
          req.flash("success", "Bid status updated successfully!");
          db.close();
          res.redirect(returnLink);
        });
    });
  });
}


module.exports = { sendConfirmationEmail, sendCancellationEmail, sendExpiredBidEmails, sendInactivationEmail, resendTokenEmail, sendForgotPasswordEmail, sendResetPasswordEmail, sendCancelBidEmail, prel, sortLists, postSignInBody, updateBidBody };