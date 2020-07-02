const sgMail = require('@sendgrid/mail');
const MongoClient = require('mongodb').MongoClient;
const bcrypt = require("bcryptjs");
const BidRequest = require("../models/bidRequest");

sgMail.setApiKey(process.env.SENDGRID_API_KEY);
const URL = process.env.MONGODB_URI, BASE = process.env.BASE;
const treatError = require('../middleware/treatError');
const { sendConfirmationEmail, sendCancellationEmail, sendInactivationEmail, resendTokenEmail, sendForgotPasswordEmail, sendResetPasswordEmail, sendCancelBidEmail, postSignInBody } = require('../public/templates');


async function removeSupervisor(id, req, res, db) {
  //Now delete the messages sent/received by Supervisor:
  await db.collection('messages').deleteMany({ $or: [ { from: id }, { to: id } ] }, function(err, resp1) {
    treatError(req, res, err, 'back');
  });
  
  //Tokens first, user last.
  await db.collection('supervisortokens').deleteMany({ _userId: id }, function(err, resp1) {
    treatError(req, res, err, 'back');
  });

  await db.collection('supervisors').deleteOne({ _id: id }, function(err, resp2) {
    treatError(req, res, err, 'back');    
  });
  
  //Mail to the ex-Supervisor to confirm their final deletion:
  sendCancellationEmail('Supervisor', req, 'sent/received messages and all your associated Buyers, including their personal data such as placed orders, sent/received messages');
  db.close();
  return res.redirect("/supervisor/sign-in");
}


const removeAssociatedBuyerBids = async (req, res, dbo, id) => {
  var promise = BidRequest.find( { buyer: id } ).exec();
  await promise.then(async (bids) => {
    var complexReason = 'The Buyer deleted their account. More details:\n' + req.body.reason;

    for(var bid of bids) {//One by one.
      try {
        await dbo.collection('bidcancelreasons').insertOne( {
          title: 'User Cancellation',
          userType: req.body.userType,
          reason: complexReason,
          userName: req.body.organizationName,
          createdAt: Date.now()
        }, function(err, obj) {
          treatError(req, res, err, 'back');
        });
      }  
      catch(e) {
        treatError(req, res, e, 'back');
      }

      await dbo.collection('bidrequests').deleteOne( { _id: bid._id }, function(err, obj) {
        treatError(req, res, err, 'back');
      });

      req.body.requestsName = bid.requestName;
      await sendCancelBidEmail(req, bid.suppliersName, bid.buyersName, bid.suppliersEmail, bid.buyersEmail, 'Supplier ', 'Buyer ', complexReason);
    }
  });
}


const removeAssociatedSuppBids = async (req, res, dbo, id) => {
  var promise = BidRequest.find( { supplier: id } ).exec();
  await promise.then(async (bids) => {
    var complexReason = 'The Supplier deleted their account. More details:\n' + req.body.reason;

    for(var bid of bids) {//One by one.          
      try {
        await dbo.collection('bidcancelreasons').insertOne( {
          title: 'Account Deletion',//req.body.reasonTitle,
          userType: req.body.userType,
          reason: complexReason,
          userName: req.body.companyName,
          createdAt: Date.now()
        }, function(err, obj) {
            treatError(req, res, err, 'back');
        });
      }  
      catch(e) {
        console.error(e);
        req.flash('error', e.message);
        throw e;
      }

      await dbo.collection('bidrequests').deleteOne( { _id: bid._id }, function(err, obj) {
        treatError(req, res, err, 'back');
      });

      req.body.requestsName = bid.requestName;
      await sendCancelBidEmail(req, bid.buyersName, bid.suppliersName, bid.buyersEmail, bid.suppliersEmail, 'Buyer ', 'Supplier ', complexReason);
    }
  });
}


async function removeAssociatedBuyerBidsSuperDel(req, res, req2, dbo, id) {
  var promise = BidRequest.find( { buyer: id } ).exec();
  await promise.then(async (bids) => {   
    for(var bid of bids) {//One by one.
      try {
        await dbo.collection('bidcancelreasons').insertOne( {
          title: 'User Cancellation',
          userType: 'Buyer',
          reason: req2.body.reason,
          userName: req2.body.organizationName,
          createdAt: Date.now()
        }, function(err, obj) {
          treatError(req, res, err, 'back');
        });
      }  
      catch(e) {
        treatError(req, res, e, 'back');
      }

      await dbo.collection('bidrequests').deleteOne( { _id: bid._id }, function(err, obj) {
        treatError(req, res, err, 'back');
      });

      req.body.requestsName = bid.requestName;
      await sendCancelBidEmail(req, bid.suppliersName, bid.buyersName, bid.suppliersEmail, bid.buyersEmail, 'Supplier ', 'Buyer ', req.body.reason);
    }
  });
}


const buyerDelete = (req, res, id) => {  
  try {    
    MongoClient.connect(URL, {useUnifiedTopology: true}, async function(err, db) {
      var dbo = db.db(BASE);
      //A Reason why the User is deleted.
      try {
        await dbo.collection('usercancelreasons').insertOne( {
          title: req.body.reasonTitle,
          reason: req.body.reason,
          userType: req.body.userType,
          userName: req.body.organizationName,
          createdAt: Date.now()
        }, function(err, obj) {
          treatError(req, res, err, 'back');
        });
      } catch(e) {
        console.error(e);
        req.flash('error', e.message);
      }
      
      //Delete Buyer's Bid Requests first:
      await removeAssociatedBuyerBids(req, res, dbo, id);

      //Now delete the messages sent or received by Buyer:
      await dbo.collection('messages').deleteMany({ $or: [ { from: id }, { to: id } ] }, function(err, resp0) {
        treatError(req, res, err, 'back');
      });

      //Remove the possibly existing Buyer Tokens:
      await dbo.collection('buyertokens').deleteMany({ _userId: id }, function(err, resp1) {
        treatError(req, res, err, 'back');
      });

      //And now, remove the Buyer themselves:
      await dbo.collection('buyers').deleteOne({ _id: id }, function(err, resp2) {
        treatError(req, res, err, 'back');
      });
    //Finally, send a mail to the ex-Buyer:
    sendCancellationEmail('Buyer', req, 'placed orders, sent/received messages', req.body.reason);
    db.close();
    req.flash('success', 'You have deleted your Buyer account. We hope that you will be back with us!');
    res.redirect("/buyer/sign-in");
    });
  } catch {
    //res.redirect("/buyer");
  }
};


const supervisorDelete = (req, res, id, uniteID) => {  
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
          treatError(req, res, err, 'back');          
        });
      } catch(e) {
        treatError(req, res, e, 'back');
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
            await removeAssociatedBuyerBidsSuperDel(req, res, req2, dbo, theId);          

            //Now delete the messages sent/received by Buyer:
            await dbo.collection('messages').deleteMany({ $or: [ { from: theId }, { to: theId } ] }, function(err, resp0) {
              treatError(req, res, err, 'back');
            });

            //Remove the possibly existing Buyer Tokens:
            await dbo.collection('buyertokens').deleteMany({ _userId: theId }, function(err, resp1) {
              treatError(req, res, err, 'back');
            });

            //And now, remove the Buyer themselves:
            await dbo.collection('buyers').deleteOne({ _id: theId }, function(err, resp2) {
              treatError(req, res, err, 'back');
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
};


const supplierDelete = (req, res, id) => {  
  try {
    //Delete Supplier's Capabilities first:
    MongoClient.connect(URL, {useUnifiedTopology: true}, async function(err, db) {
      var dbo = db.db(BASE);
      
      try{
        await dbo.collection('usercancelreasons').insertOne( {
          title: req.body.reasonTitle,
          reason: req.body.reason,
          userType: req.body.userType,
          userName: req.body.companyName,
          createdAt: Date.now()
        }, function(err, obj) {
          treatError(req, res, err, 'back');
        });
      } catch(e) {
        console.error(e);
        req.flash('error', e.message);
      }
      
      await dbo.collection('capabilities').deleteMany({ supplier: id }, function(err, resp) {
        treatError(req, res, err, 'back');
      });

      //Products/Services offered:
      await dbo.collection('productservices').deleteMany({ supplier: id }, function(err, resp0) {
        treatError(req, res, err, 'back');
      });

      //Now delete the messages sent/received by Supplier:
      await dbo.collection('messages').deleteMany({ $or: [ { from: id }, { to: id } ] }, function(err, resp1) {
        treatError(req, res, err, 'back');
      });
    
      //The received bids:
      await removeAssociatedSuppBids(req, res, dbo, id);
            
      //Remove the possibly existing Supplier Tokens:
      await dbo.collection('suppliertokens').deleteMany({ _userId: id }, function(err, resp3) {
        treatError(req, res, err, 'back');
      });

      //And now, remove the Supplier themselves:
      await dbo.collection('suppliers').deleteOne({ _id: id }, function(err, resp4) {
        treatError(req, res, err, 'back');
      });

      //Finally, send a mail to the ex-Supplier:
      sendCancellationEmail('Supplier', req, 'received orders, products/services offered, listed capabilities, sent/received messages', req.body.reason);
      db.close();
      req.flash('success', 'You have deleted your Supplier account. We hope that you will be back with us!');
      return res.redirect("/supplier/sign-in");
    });
  } catch {
  }
}

module.exports = { removeAssociatedBuyerBids, removeAssociatedSuppBids, buyerDelete, supervisorDelete, supplierDelete };