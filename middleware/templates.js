const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
const MongoClient = require('mongodb').MongoClient;
const bcrypt = require("bcryptjs");
const fs = require('fs-extra');
const BidRequest = require("../models/bidRequest");
const ObjectId = require("mongodb").ObjectId;
const URL = process.env.MONGODB_URI, BASE = process.env.BASE;
const treatError = require('../middleware/treatError');
const captchaSecretKey = process.env.RECAPTCHA_V2_SECRET_KEY;
const fetch = require('node-fetch');
const internalIp = require('internal-ip');
const { verifyBanNewUser, verifyBanExistingUser } = require('../middleware/verifyBanned');
const search = require('../middleware/searchFlash');
const jsonp = require("jsonp");
const _ = require("underscore");

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

      //console.log('A verification email has been sent to ' + req.body.emailAddress  + '.');
      req.flash('success', 'A verification email has been sent to ' + req.body.emailAddress + '.\n');
    });
};


const fileExists = (path) => {
  return path? fs.existsSync(path) : false;
}


const prel = (req, isFloat, isInt) => {
  let arr = (req);
  console.log(req);
  if(!(Array.isArray(arr)))
    arr = arr.split(',');
  
  let newProd = [];
  for (let i in arr) {
    newProd.push(isFloat? parseFloat(arr[i]).toFixed(2) : isInt? parseInt(arr[i]) : String(arr[i]));
    }
  
  return newProd;
}


const sortLists = (productList, amountList, priceList, imagesList, suppCurrenciesList) => {
  let arr = [], arr2 = [], arr3 = [], arr4 = [], arr5 = [], arr6 = [];
  
  for(let i in productList) {
    arr.push(productList[i]);
  }
  
  arr.sort();
  
  for(let i in arr) {
    for(let j in productList) {
      if(arr[i] == productList[j]) {
        arr2.push(amountList[j]);
        arr3.push(priceList[j]);
        arr4.push(imagesList[j]);
        if(suppCurrenciesList) {
          arr5.push(suppCurrenciesList[j]);
          //arr6.push(supplierCurrenciesListProd[i]);
        }
        break;
      }
    }
  }
  
  for(let i in productList) {
    productList[i] = arr[i];
    amountList[i] = arr2[i];
    priceList[i] = arr3[i];
    imagesList[i] = arr4[i];
    if(suppCurrenciesList) {
      suppCurrenciesList[i] = arr5[i];
      //supplierCurrenciesListProd[i] = arr6[i];
    }
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


const sendBanEmail = (type, req, data, date, reason) => {//Ban!
  sgMail.send({
    from: 'peter@uniteprocurement.com',
    to: req.body.emailAddress, 
    subject: `UNITE - ${type} Account Banned`,
    text: 
      `Hello ${req.body.organizationName? req.body.organizationName : req.body.companyName},\n\nWe are sorry to inform you that you have been banned from the UNITE Public Procurement Platform.\n\nYour ${type} account will no longer be accssible until the date of ${date}, and also your specific user data like  ${data} and any user tokens saved by you have also been lost.\nWe hope to see you back in the coming future, with an improved behaviour.\n\nUNITE counts on education level and seriety of its users!\n\nWith kind regards,\nThe UNITE Public Procurement Platform Team`,
    html: reason? '<p style="color: brown; font-size: 12pt; font-weight: bold italic; word-wrap: break-word; font-face: arial"><br>' + reason + '</p>' : null
  }, function (err, resp) {
     if (err ) {
      return console.log(err.message);
    }

      console.log('A ban notification email has been sent to ' + req.body.emailAddress + '.');
      req.flash('success', 'A ban notification email has been sent to ' + req.body.emailAddress + '.\n' + `${type} account banned!`);
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
          
          let msg = "The Bid Request has been cancelled by the " + actorType + actor + '.\n' + victimType + victim + ' has been notified via e-mail about the Order cancellation.';
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
  let dbLink = link + 's';
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

         let dbo = db.db(BASE);
         console.log(dbLink);        
         
         dbo.collection(dbLink).findOne( { emailAddress: email}, async (err, doc) => {
          if(err) 
            return console.error(err.message);

          if(!doc) {
            req.flash("error", "Invalid e-mail address!");
            return res.redirect(`/${link}/sign-in`);
          }
           
            const ipv4 = await internalIp.v4();
            verifyBanExistingUser(dbo, req, res, doc, ipv4);
           
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

              if (doMatch) {
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
    for(let i in expiredBids) {
      if(expiredBids[i].isExpired == false) {
        MongoClient.connect(URL, {useUnifiedTopology: true}, function(err, db) {//db or client.
          if(treatError(req, res, err, 'back'))
            return false;

          let dbo = db.db(BASE);
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

    let dbo = db.db(BASE);
    
    let bid = await dbo.collection("bidrequests").findOne({ _id: reqId }, function(err, bid) {
      if (treatError(req, res, err, "back") || !bid) 
        return false;
      let values;
      
      if(!bid.isExpired && !bid.isExtended && bid.validityExtensionId) {
        let extDuration = process.env.DAYS_BID_EXTENDED * process.env.DAY_DURATION;
        let newDate = bid.expiryDate + extDuration;
        let newDateFormatted = customFormat(newDate);
        values = { $set: { isExtended: true, expiryDate: newDate, expiryDateFormatted: newDateFormatted, status: req.body.status } };
      } else {
        values = { $set: { status: req.body.status } };
      }
      
      if(req.body.status == process.env.PAYMENT_DELIVERY_DONE) {//Update the balance of the Supplier.
        let supplier = getDataMongo(dbo, 'suppliers', { _id: bid.supplier });
        let newBalance = parseFloat(bid.supplierPrice) + (supplier && supplier.balance? parseFloat(supplier.balance) : 0);
        dbo.collection('suppliers').updateOne({ _id: supplier._id }, { $set: { balance: parseFloat(newBalance).toFixed(2) } }, function(err, obj) {});
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


const getObjectMongo = async (db, table, obj, field) => {
  let myPromise = () => {
    return new Promise((resolve, reject) => {
      db
      .collection(table)
      .findOne((typeof obj !== 'undefined' && obj instanceof Object)? obj : {}, typeof field !== 'undefined' && field instanceof Object? field : {}, function(err, data) {
         err 
            ? reject(err) 
            : resolve(data);
       });
     });
  };

  let result = await myPromise();
  return result;
};


const getObjectMongoose = async (model, obj, field) => {
  let myPromise = () => {
    return new Promise((resolve, reject) => {
      eval(`let ${model} = require('../models/${lowerCase(model)}'); ${model}.findOne((typeof obj !== 'undefined' && obj instanceof Object)? obj : {}, typeof field !== 'undefined' && field instanceof Object? field : {}, (err, data) => { err? reject(err) : resolve(data); });`);
    });
  };

  let result = await myPromise();
  return result;
};


const getDataMongo = async(db, table, obj, field) => {//DB connection active.
  let myPromise = () => {
    return new Promise((resolve, reject) => {
      db
      .collection(table)
      .find(typeof obj !== 'undefined' && obj instanceof Object? obj : {},
           typeof field !== 'undefined' && field instanceof Object? field : {})
      .toArray(function(err, data) {
         err 
            ? reject(err) 
            : resolve(data);
       });
     });
  };

  let result = await myPromise();
  return result;
}


//function lowerCase
function lowerCase(s) {
  return s.replace(/^.{1}/g, s[0].toLowerCase());
}


const getDataMongoose = async (model, obj, field) => {//A Mongoose model name.
  let myPromise = () => {
    return new Promise((resolve, reject) => {
      eval(`let ${model} = require('../models/${lowerCase(model)}'); ${model}.find(typeof obj !== 'undefined' && obj instanceof Object? obj : {}, typeof field !== 'undefined' && field instanceof Object? field : {}).then((data, err) => { err || !data? reject(err) : resolve(data); });`);      
    });
  };

  let result = await myPromise();
  return result;
}


const getBidStatusesJson = function() { 
  return {
    BUYER_REQUESTED_BID: parseInt(process.env.BUYER_REQ_BID),
    WAIT_BUYER_PROCESS_INFO: parseInt(process.env.BUYER_PROC_INFO),
    BUYER_WANTS_FOR_PRICE: parseInt(process.env.BUYER_ACCEPT_PRICE),
    SUPP_STARTED_DELIVERY: parseInt(process.env.SUPP_START_DELIVERY),
    PAYMENT_DELIVERY_DONE: parseInt(process.env.PAYMENT_DELIVERY_DONE),
    SUPPLIER_CANCELS_BID: parseInt(process.env.SUPP_CANCEL_BID),
    BUYER_CANCELS_BID: parseInt(process.env.BUYER_CANCEL_BID)
  }
};


const renderBidStatuses = async () => {
  let result = [], data = await getDataMongoose('BidStatus');
 
  if(data && data.length && data.length > 0) {
    data.forEach((item) => {
      let obj = {
        id: item._id,
        value: item.value,
        name: item.value + " - " + item.name
      };

      result.push(obj);
    });
  }
  
  return result;
}


const uniqueJSONArray = (elem, array) => {
  for(let i of array) {
    if(i.id === elem.id) {
      return false;
    }
  }
  
  array.push(elem);
}


function prepareBidData(req) {
  let productList = prel(req.body.productList);
  let amountList = prel(req.body.amountList, false, true);
  let priceList = prel(req.body.priceList, true, false);
  let priceOriginalList = prel(req.body.priceOriginalList, true, false);
  let imagesList = req.body.productImagesList? prel(req.body.productImagesList) : [];
  let idsList = req.body.productIdsList? prel(req.body.productIdsList) : [];
  
  let suppCurrListProd = (req.body.supplierCurrenciesListProd)?
                          prel(req.body.supplierCurrenciesListProd) : [];
  
  sortLists(productList, amountList, priceList, imagesList, suppCurrListProd);
  if(!(suppCurrListProd.length) && req.body.supplierCurrency) {
    suppCurrListProd.push(req.body.supplierCurrency);
  }

  let products = [];

  for (let i in productList) {//JSON, not string.
    products.push({
      id: (idsList[i] && idsList[i].length)? idsList[i] : null,
      productName: productList[i],
      productImage: (imagesList[i] != null && imagesList[i].length > 0)? imagesList[i] : null,
      buyerPrice: priceOriginalList[i],
      supplierPrice: priceList[i],      
      buyerCurrency: req.body.buyerCurrency,
      supplierCurrency: req.body.supplierCurrency,
      amount: amountList[i],
      totalPrice: parseFloat(priceList[i] * amountList[i]).toFixed(2),
      supplier: req.body.supplierId?
        req.body.supplierId : (req.body.supplierIdsList && req.body.supplierIdsList[i])? req.body.supplierIdsList[i] : null
    });
  }
  
  return {
    productList: productList, 
    amountList: amountList, 
    priceList: priceList, 
    priceOriginalList: priceOriginalList, 
    imagesList: imagesList, 
    productIdsList: idsList,
    supplierCurrenciesListProd: suppCurrListProd,
    products: products
  };
}


function isPresent(elem, array) {
  if(array.length)
  for(let i in array) {
    if(elem == array[i])
      return true;
  }
  
  return false;
}


function arrangeMultiData(t, suppIds) {
  let productLists = [], amountLists = [], productImagesLists = [], priceLists = [], priceOriginalLists = [], productDetailsLists = [];
  let uniqueSuppIds = [];
  let app = [];
  
  for(let i in suppIds) {//0, 1, 2, 3, 4 - 0=2=4, 1=3.
    //i=0, app=[]
    //i=1, app=024
    //i=2, app=02413
    //i=3, app=02413
    //i=4, app=02413
    let productList = [], amountList = [], productImagesList = [], priceList = [], priceOriginalList = [], productDetailsList = [];
    
    if(!isPresent(suppIds[i], app)) {
      for(let j in suppIds) {//0: 0, 2, 4.
        if(suppIds[i] == suppIds[j]) {
          app.push(suppIds[j]);
          productList.push(t.productList[j]);
          amountList.push(t.amountList[j]);
          productImagesList.push(t.imagesList[j]);
          priceList.push(t.priceList[j]);
          priceOriginalList.push(t.priceOriginalList[j]);
          productDetailsList.push(t.products[j]);
        }
      }
      
      productLists.push(productList);
      amountLists.push(amountList);
      productImagesLists.push(productImagesList);
      priceLists.push(priceList);
      priceOriginalLists.push(priceOriginalList);
      productDetailsLists.push(productDetailsList);
      uniqueSuppIds.push(suppIds[i]);
    }
    
    if(app.length == suppIds.length)
      break;
  }
  
  return {
    productList: productLists, 
    amountList: amountLists, 
    priceList: priceLists, 
    priceOriginalList: priceOriginalLists, 
    imagesList: productImagesLists, 
    products: productDetailsLists,
    uniqueSuppIds: uniqueSuppIds
  };
}


async function suggest(prod, buyerId) {
  let products = [], i = 0, bids = await getDataMongoose('BidRequest', {
    $and: [
      { buyer: { $ne: buyerId } },
      {
        $or: [
      {"productDetailsList.productName": prod.productName},
      {"productDetailsList.id": prod._id}
      ]
      }]
  });
 
    //loop1:    
    for(let bid of bids) {
      for(let product of bid.productDetailsList) {
        if(product.productName != prod.productName || product.id != prod._id) {          
          products.push(product);
          //if(++i == process.env.MAX_PROD_SUGGESTED) {
           // break loop1;
          //}
        }
      }
    }
   
    return products;
}


const getCatalogItems = async () => {
  let products = await getDataMongoose('ProductService');
  let catalogItems = [];

  for (let i in products) {
    let supId = products[i].supplier;
    let obj = await getObjectMongoose('Supplier', { _id: products[i].supplier });

    if(obj) {
      catalogItems.push({
        productId: products[i]._id,
        supplierId: obj._id,
        productName: products[i].productName,
        price: products[i].price,
        amount: products[i].amount,
        totalPrice: products[i].totalPrice,
        productImage: fileExists(products[i].productImage)? products[i].productImage : '',
        buyerCurrency: products[i].currency,
        supplierCurrency: obj.currency,
        supplierName: obj.companyName
      });
    }
  }

  catalogItems.sort(function(a, b) {
    return a.productName.localeCompare(b.productName);
  });
  
  return catalogItems;
}


const getPlaceBidBody = async (req, res) => {
  let buyerId = (req.params.buyerId? req.params.buyerId : req.body.buyerId), productId = (req.params.productId), supplierId = (req.params.supplierId);
  let productIds = req.body.bidProductList? req.body.bidProductList : [], supplierIds = req.body.bidSupplierList? req.body.bidSupplierList : [];
  //let otherSuppliers = req.body.allowMultiple? await getDataMongoose('Supplier') : null;  
  
  if(!productIds.length && productId) {
    productIds.push(productId);
  }
  
  if(!supplierIds.length && supplierId) {
    supplierIds.push(supplierId);
  }
  
  let productList = productIds.length? prel(productIds) : [];
  let supplierList = prel(supplierIds);
  let prodIds = [], suppIds = [];

  for(let i in productList) {
    prodIds.push(new ObjectId(productList[i]));
  }

  for(let i in supplierList) {
    suppIds.push(new ObjectId(supplierList[i]));
  }

  let uniqueSupplierIds = suppIds.filter((v, i, a) => a.indexOf(v) === i);
  let buyer = await getObjectMongoose('Buyer', { _id: buyerId });
  let products = prodIds.length? await getDataMongoose('ProductService', { _id: { $in: prodIds } }) : [];//Empty if bidding outside the Catalog.
  let suppliers = await getDataMongoose('Supplier', { _id: { $in: uniqueSupplierIds } });  
  
  if(!buyer || !products.length || !suppliers.length || !statuses.length) {
    req.flash('error', 'Data not found in the database!');
    res.redirect('back');
  }

  let suggestions = [], suggestionsList = [];
  if(products.length) {
    for(let i in products) {//Find a suggestion for this product:
      if(!fileExists(products[i].productImage))
        products[i].productImage = '';
      
      suggestionsList = await suggest(products[i], buyer._id);     
      
      for(let i of suggestionsList) {
        suggestions.push(i);
      }    
    }

    if(suggestionsList.length) {
      suggestionsList = _.uniq(suggestions, false, function(item) { return item.id; });  
      let len = suggestionsList.length;
      suggestions = [];

      while(1) {
        let num = parseInt(Math.random() * len);
        suggestions.push(suggestionsList[num]);
        console.log(suggestions);

        if(suggestions.length > 1) 
          suggestions = _.uniq(suggestions, false, function(item) { return item.id; });
          //Keep the first [const] suggestions:
          if(suggestions.length == process.env.MAX_PROD_SUGGESTED)
            break;
      }

      suggestions.sort(function(a, b) {
        return a.productName.localeCompare(b.productName);
      });
    }
  }

  let statuses = await getDataMongoose('BidStatus');
  let catalogItems = (prodIds.length)? [] : await getCatalogItems();
  let currencies = await getCurrenciesList();
  let success = search(req.session.flash, "success"), error = search(req.session.flash, "error");
  req.session.flash = [];
  let isMultiProd = prodIds.length > 1;
  let isMultiSupp = uniqueSupplierIds.length > 1;
  let statusesJson = JSON.stringify(getBidStatusesJson());  
  
  console.log(buyerId + ' ' + productId + ' ' + supplierId);
  console.log(isMultiProd + ' ' + !isMultiProd + ' ' + !products.length);
  console.log(suppliers.length + ' ' + req.body.bidSupplierList + ' ' + isMultiSupp);  
  //throw new Error();
  setTimeout(function() {
    res.render("buyer/placeBid", {
        successMessage: success,
        errorMessage: error,
        currencies: currencies,
        isMultiProd: isMultiProd,
        isMultiSupp: isMultiSupp,
        isMultiBid: isMultiSupp,
        isSingleBid: !isMultiSupp,
        isSingleProd: !isMultiProd,
        isNoProd: !products.length,//Outside Catalog.
        MAX_PROD: process.env.BID_MAX_PROD,
        MAX_AMOUNT: process.env.MAX_PROD_PIECES,
        BID_DEFAULT_PRICE: process.env.BID_DEFAULT_PRICE,
        BID_DEFAULT_CURR: process.env.BID_DEFAULT_CURR,
        FILE_UPLOAD_MAX_SIZE: process.env.FILE_UPLOAD_MAX_SIZE,
        statuses: statuses,
        statusesJson: statusesJson,
        suggestions: suggestions,
        buyer: buyer,
        path: req.params.productId? '../../../' : '../',
        product: products.length? products[0] : null,
        supplier: suppliers[0],
        catalogItems: catalogItems,
        products: products,
        suppliers: suppliers
      });
    }, 3000);
}


const saveBidBody = async (req, res, path) => {
    //New Bid Request placed.
    let fix;
  
    if(typeof fx == 'undefined') {
      fix = require("money");
      let initConversions = require("../middleware/exchangeRates");
      await initConversions(fix);
    } else {
      eval('fix = fx;');
    }
  
    let suppIds = req.body.supplierIdsList? prel(req.body.supplierIdsList) : [];//Multi or not.
    let t = prepareBidData(req), names, emails, suppCurrencies, suppCurrenciesByProd, totalPricesList;
    
    if(req.body.supplierId) {//Not Multi.
      suppIds.push(req.body.supplierId)
    } else {//Multi Supplier!
      names = req.body.supplierNamesList? prel(req.body.supplierNamesList) : [];
      emails = req.body.supplierEmailsList? prel(req.body.supplierEmailsList) : [];
      suppCurrencies = req.body.supplierCurrenciesList? prel(req.body.supplierCurrenciesList) : [];//currencies
      totalPricesList = req.body.supplierTotalPricesList? prel(req.body.supplierTotalPricesList, true) : [];
      t = arrangeMultiData(t, suppIds);
      suppIds = suppIds.filter((v, i, a) => a.indexOf(v) === i);
      //suppIds = t.uniqueSuppIds;
    };
   
    //Supplier's name, e-mail, currency, total price to be saved as lists in PlaceBid in case of Multi.
    let asyncCounter = 0;
    
     for(let i = 0; i < suppIds.length; i++) {
       let buyerPrice = !(t.uniqueSuppIds)? req.body.buyerPrice :fix(parseFloat(totalPricesList[i]).toFixed(2))
                .from(suppCurrencies[i])
                .to(req.body.buyerCurrency);       
      
      const bidRequest = new BidRequest({
        requestName: req.body.requestName,
        supplierName: req.body.supplierName? req.body.supplierName : names[i],
        buyerName: req.body.buyerName,
        buyerEmail: req.body.buyerEmail,
        supplierEmail: req.body.supplierEmail? req.body.supplierEmail : emails[i],
        itemDescription: req.body.itemDescription,
        productDetailsList: !(t.uniqueSuppIds)? t.products : t.products[i],
        itemDescriptionLong: req.body.itemDescriptionLong,
        itemDescriptionUrl: req.itemDescriptionUrl,
        amount: req.body.amount,
        deliveryLocation: req.body.deliveryLocation,
        deliveryRequirements: req.body.deliveryRequirements,
        complianceRequirements: req.body.complianceRequirements,
        complianceRequirementsUrl: req.body.complianceRequirementsUrl,
        preferredDeliveryDate: req.body.preferredDeliveryDate,
        otherRequirements: req.body.otherRequirements,
        status: req.body.status,
        buyerPrice: buyerPrice,
        supplierPrice: req.body.supplierPrice? req.body.supplierPrice : totalPricesList[i],
        isCancelled: false,
        isExpired: false,
        isExtended: req.body.validityExtensionId? true : false,
        buyerCurrency: req.body.buyerCurrency,
        supplierCurrency: req.body.supplierCurrency? req.body.supplierCurrency : suppCurrencies[i],
        validityExtensionId: req.body.validityExtensionId,
        validityExtension: req.body.validityExtensionId,
        specialMentions: req.body.specialMentions
          ? req.body.specialMentions
          : req.body.buyerName +
            " has sent a new Order to " +
            (req.body.supplierName? req.body.supplierName : names[i]) +
            ", and the Bid price is " +
            (req.body.supplierPrice? req.body.supplierPrice : totalPricesList[i]) +
            " " +
            (req.body.supplierCurrency? req.body.supplierCurrency : suppCurrencies[i]) +
            ".",
        createdAt: req.body.createdAt ? req.body.createdAt : Date.now(),
        updatedAt: Date.now(),
        expiryDate:
          Date.now() + process.env.BID_EXPIRY_DAYS * process.env.DAY_DURATION + (req.body.validityExtensionId? process.env.DAYS_BID_EXTENDED * process.env.DAY_DURATION : 0),
        createdAtFormatted: req.body.createdAt
          ? normalFormat(req.body.createdAt)
          : normalFormat(Date.now()),
        updatedAtFormatted: normalFormat(Date.now()),
        expiryDateFormatted: customFormat(
          Date.now() + process.env.BID_EXPIRY_DAYS * process.env.DAY_DURATION + (req.body.validityExtensionId? process.env.DAYS_BID_EXTENDED * process.env.DAY_DURATION : 0)
        ),
        buyer: req.body.buyer,
        supplier: suppIds[i]
      });
       
      bidRequest
        .save()
        .then((err, result) => {
          if(++asyncCounter == suppIds.length) {
            if(treatError(req, res, err, path+"buyer"))
              return false;
            
             req.flash("success", "Bid requested successfully!");
             return res.redirect(path+"buyer"); 
          }
      })
      .catch(console.error);
    }
}


const getCancelReasonTitles = async (objectType, isAdmin, isSupervisor) => {  
  let val = objectType && isAdmin? { type: objectType , isAdmin: true } 
    : objectType && isSupervisor? { type: objectType, isSupervisor: isSupervisor } 
    : objectType? { type: objectType } : {};
  
  let titles = await getDataMongoose('CancelReasonTitle', val);

  titles.sort(function(a, b) {
    return a.name.localeCompare(b.name);
  });
  
  return titles;
}


const stripeSecretKey = process.env.STRIPE_KEY_SECRET;
const stripePublicKey = process.env.STRIPE_KEY_PUBLIC;
const stripe = require("stripe")(stripeSecretKey);

const completePurchase = (req, res, next) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type"
  };

  stripe.customers
    .create({
      email: req.body.emailAddress,
      //card: '4242424242424242'//
      source: req.body.stripeTokenId
    })
    .then((customer) =>
      stripe.charges.create({
        amount: req.body.amount,
        receipt_email: req.body.emailAddress,
        description: req.body.description,
        customer: customer.id,
        //source: req.body.stripeTokenId,
        currency: req.body.currency.toLowerCase()
      })
    )
    .then(async (charge) => {
      console.log("Payment successful!\n" + charge);
      const response = {
        headers,
        statusCode: 200,
        body: JSON.stringify({
          message: "You have successfully paid for your items!",
          charge: charge
        })
      };

      //Update the Balance:
      await MongoClient.connect(
        URL,
        { useUnifiedTopology: true },
        (err, client) => {
          if (err) {
            console.error(err.message);
            //req.flash('error', err.message);
            return res.status(500).send({ msg: err.message });
          }

         let  db = client.db(BASE); //Right connection!
          db.collection("buyers").updateOne(
            { _id: req.body.buyerId },
            { $set: { balance: req.body.newBalance } },
            function(err, obj) {
              if (err) {
                console.error(err.message);
                return res.status(500).send({ msg: err.message });
              }
            }
          );
        }
      );

      //Send an e-mail to user:
      let mailOptions = {
        from: "peter@uniteprocurement.com",
        to: req.body.emailAddress,
        subject: "Order Paid Successfully!",
        text:
          "Hello,\n\n" +
          "We inform you that your purchase in value of" +
          req.body.amount +
          " " +
          req.body.currency +
          " has been successfully completed. Please wait for your delivery to finish.\nCurrently it was just a test, nothing for real yet though :)." +
          "\n\nWith kind regards,\nThe UNITE Public procurement Platform Team"
      };

      sgMail.send(mailOptions, function(err, resp) {
        if (err) {
          console.error(err.message);
          return res.status(500).send({ msg: err.message });
        }
        console.log(
          "Message sent: " + resp ? resp.response : req.body.emailAddress
        );
        req.flash(
          "success",
          "A verification email has been sent to " + req.body.emailAddress,
          +"."
        );
        res.json(response);
      });
    })
    .catch((err) => {
      console.log("Payment failed! Please repeat the operation.\n" + err);
      /*const response = {
        headers,
        statusCode: 500,
        body: JSON.stringify({
          error: err.message
        })
      };*/

      //res.json(response);
      res.status(500).end();
    });
}

/*
const uniteIDAutocompleteBody = async (req, res) => {
  let regex = new RegExp(req.query["term"], "i");
  let val = regex? { organizationUniteID: regex } : {};  
  let data = await getDataMongoose('Supervisor', val);

  if (data && data.length && data.length > 0) {
    let result = [];
    
    data.sort(function(a, b) {
      return a.organizationUniteID.localeCompare(b.organizationUniteID);
    });
    
    data.forEach((item) => {
      let obj = {
        id: item._id,
        name: item.organizationUniteID
      };

      result.push(obj);
    }); 

    res.jsonp(result);
    } else {
    req.flash("error", 'UNITE IDs not found!');
  }
}*/


const deleteFileBody = (req, res) => {
   //fs2.unlinkSync(req.body.file);
  console.log(req.body.file);

  fs.unlink(req.body.file, function(err) {
    if (err) {
      req.flash("error", err.message);
      res.json(err);
    }
    //if no error, file has been deleted successfully
    console.log("File deleted!");
    req.flash("success", "File deleted!");
    res.status(200).end();
  });
}


const getCurrenciesList = async () => {  
  let result = [], data = await getDataMongoose('Currency');
  
  if (data && data.length && data.length > 0) {  
    data.sort((a, b) => {
      return a.value.localeCompare(b.value);
    });

    data.forEach((item) => {     
      result.push({
        id: item._id,
        name: item.value,
        value: item.name
      });
    });
  }
  
  return result;
}

const encryptionNotice = 'For your protection, UNITE uses encryption for your stored passwords.\nThus, it may take a certain amount of time for your encrypted password to be saved, after you press Sign Up or when you reset the password.\nThank you for your understanding, and remember that UNITE strives for ensuring a safe climate to its Users!';


module.exports = { fileExists, sendConfirmationEmail, sendCancellationEmail, sendExpiredBidEmails, sendInactivationEmail, resendTokenEmail, sendForgotPasswordEmail, sendResetPasswordEmail, sendBanEmail, sendCancelBidEmail, prel, sortLists, getObjectMongo, getObjectMongoose, getDataMongo, getDataMongoose, uniqueJSONArray, getBidStatusesJson, renderBidStatuses, postSignInBody, getCatalogItems, getPlaceBidBody, saveBidBody, updateBidBody, encryptionNotice, getCancelReasonTitles, getCurrenciesList, deleteFileBody, completePurchase };