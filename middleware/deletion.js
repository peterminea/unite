const sgMail = require('@sendgrid/mail');
const MongoClient = require('mongodb').MongoClient;
const bcrypt = require("bcryptjs");
const BidRequest = require("../models/bidRequest");

sgMail.setApiKey(process.env.SENDGRID_API_KEY);
const URL = process.env.MONGODB_URI, BASE = process.env.BASE;
const treatError = require('../middleware/treatError');
const { sendConfirmationEmail, sendCancellationEmail, sendInactivationEmail, resendTokenEmail, sendForgotPasswordEmail, sendResetPasswordEmail, sendBanEmail, sendCancelBidEmail, getCancelReasonTitles, getDataMongoose, postSignInBody } = require('../middleware/templates');


async function removeSupervisor(id, req, res, db, isBan) {
  //Now delete the messages sent/received by Supervisor:
  await db.collection('messages').deleteMany({ $or: [ { from: id }, { to: id } ] }, function(err, resp1) {
    treatError(req, res, err, 'back');
  });
  
  //Tokens first, user last.
  await db.collection('supervisortokens').deleteMany({ _userId: id }, function(err, resp1) {
    treatError(req, res, err, 'back');
  });
  
  if(isBan) {
    await db.collection('bannedusers').insertOne({
            name: req.body.organizationName,
            type: process.env.USER_SPV,
            email: req.body.emailAddress,
            userId: id,
            ip: req.body.ipv4Address,
            banDate: Date.now(),
            banExpiryDate: req.body.endDate//To format.
          });

    await sendBanEmail('Supervisor', req, 'sent/received messages and all your associated Buyers, including their personal data such as placed orders, sent/received messages', req.body.endDate, req.body.reason);
    
    db.close();    
    req.flash('success', 'This Supervisor account has been banned. Affected users have been notified upon it.');
    res.redirect("back");
  } else {
    await db.collection('supervisors').deleteOne({ _id: id }, function(err, resp2) {
      treatError(req, res, err, 'back');    
    });

  //Mail to the ex-Supervisor to confirm their final deletion:
    await sendCancellationEmail('Supervisor', req, 'sent/received messages and all your associated Buyers, including their personal data such as placed orders, sent/received messages');
    
    db.close();    
    req.flash('success', 'You have deleted your Supervisor account. We hope that you and your Buyers will be back with us!');
    res.redirect("/supervisor/sign-in");
  }
}


const removeAssociatedBuyerBids = async (req, res, dbo, id) => {  
  let bids = await getDataMongoose('BidRequest', { buyer: id });
  let complexReason = 'The Buyer deleted their account. More details:\n' + req.body.reason;

  for(let bid of bids) {//One by one.
    try {
      await dbo.collection('cancelreasons').insertOne( {
        title: 'Bid Cancellation',
        cancelType: process.env.BID_CANCEL,
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
}


const removeAssociatedSuppBids = async (req, res, dbo, id) => {
  let bids = await getDataMongoose('BidRequest', { supplier: id });
  let complexReason = 'The Supplier deleted their account. More details:\n' + req.body.reason;

  for(let bid of bids) {//One by one.          
    try {
      await dbo.collection('cancelreasons').insertOne( {
        title: 'Account Deletion',//req.body.reasonTitle,
        cancelType: process.env.USER_CANCEL,
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
}


async function removeAssociatedBuyerBidsSuperDel(req, res, req2, dbo, id) {
  let bids = await getDataMongoose('BidRequest', { buyer: id });
 
  for(let bid of bids) {//One by one.
    try {
      await dbo.collection('cancelreasons').insertOne( {
        title: 'User Cancellation',
        cancelType: process.env.USER_CANCEL,
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
}


const buyerDelete = async (req, res, id, isBan, isSupervisor) => {  
  try {    
    MongoClient.connect(URL, {useUnifiedTopology: true}, async function(err, db) {
      let dbo = db.db(BASE);
      //A Reason why the User is deleted.
      try {
        await dbo.collection('cancelreasons').insertOne( {
          title: req.body.reasonTitle,
          cancelType: isBan? process.env.USER_BAN_TYPE : process.env.USER_CANCEL_TYPE,
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
      
      if(isBan) {//Update the Ban table.        
        await dbo.collection('bannedusers').insertOne({
          name: req.body.organizationName,
          type: process.env.USER_BUYER,
          email: req.body.emailAddress,
          userId: id,
          ip: req.body.ipv4Address,
          banDate: Date.now(),
          banExpiryDate: req.body.endDate//To format.
        });
       
      sendBanEmail('Buyer', req, 'placed orders, sent/received messages', req.body.reason);
      } else {
        //And now, remove the Buyer themselves:
        await dbo.collection('buyers').deleteOne({ _id: id }, function(err, resp2) {
          treatError(req, res, err, 'back');
        });
      //Finally, send a mail to the ex-Buyer:
      sendCancellationEmail('Buyer', req, 'placed orders, sent/received messages', req.body.reason);
      }
      
    db.close();
      if(isBan) {
        req.flash('success', 'You have banned this User account successfully.');
        res.redirect("back");
      } else {
        isSupervisor? req.flash('success', 'You have deleted the account of your Buyer.\nWe regret that you experienced inconveniences, and wish you best collaborations!') 
          : req.flash('success', 'You have deleted your Buyer account.\nWe hope that you will be back with us!');
        res.redirect("/buyer/sign-in");
      }
    });
  } catch {
    //res.redirect("/buyer");
  }
};


const supervisorDelete = (req, res, id, uniteID, isBan) => {  
  try {
    //Find Supervisor's Buyers first:
    MongoClient.connect(URL, {useUnifiedTopology: true}, async function(err, db) {
      let dbo = db.db(BASE);
      
      try {
        await dbo.collection('cancelreasons').insertOne( {
          title: req.body.reasonTitle,
          cancelType: isBan? process.env.USER_BAN_TYPE : process.env.USER_CANCEL_TYPE,
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
          await removeSupervisor(id, req, res, db, isBan);
        } else {
          let len = buyers.length;
          let complexReason = 'Buyer\'s account was deleted because their Supervisor ' 
          + (isBan? 'was banned.' : 'did the same.') 
          + ' Please see more details on the Supervisor:\n' + req.body.reason;
          
          //Delete buyers data one by one:
          for(let i in buyers) {
            let theId = buyers[i]._id;
            let req2 = { body: { reason: complexReason, emailAddress : buyers[i].emailAddress, organizationName : buyers[i].organizationName } };
            
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
          await removeSupervisor(id, req, res, db, isBan);        
          }
      });
    });
  } catch {
  }
};


const supplierDelete = (req, res, id, isBan) => {  
  try {
    //Delete Supplier's Capabilities first:
    MongoClient.connect(URL, { useUnifiedTopology: true }, async function(err, db) {
      let dbo = db.db(BASE);
      
      try{
        await dbo.collection('cancelreasons').insertOne( {
          title: req.body.reasonTitle,
          cancelType: isBan? process.env.USER_BAN_TYPE : process.env.USER_CANCEL_TYPE,
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
      
      if(isBan) {//Update the Ban table.        
        await dbo.collection('bannedusers').insertOne({
          name: req.body.companyName,
          type: process.env.USER_SUPPLIER,
          email: req.body.emailAddress,
          userId: id,
          ip: req.body.ipv4Address,
          banDate: Date.now(),
          banExpiryDate: req.body.endDate//To format.
        });
       
      sendBanEmail(process.env.USER_SUPPLIER, req, 'received orders, products/services offered, listed capabilities, sent/received messages', req.body.reason);
      } else {
        //And now, remove the Supplier themselves:
        await dbo.collection('suppliers').deleteOne({ _id: id }, function(err, resp4) {
          treatError(req, res, err, 'back');
        });

        //Finally, send a mail to the ex-Supplier:
        sendCancellationEmail('Supplier', req, 'received orders, products/services offered, listed capabilities, sent/received messages', req.body.reason);
      }      
      
      if(isBan) {
        req.flash('success', 'You have banned this User account successfully.');
        res.redirect("back");
      } else {
        req.flash('success', 'You have deleted your Supplier account. We hope that you will be back with us!');
        res.redirect("/supplier/sign-in");
      }

      db.close();      
    });
  } catch {
  }
}

module.exports = { removeAssociatedBuyerBids, removeAssociatedSuppBids, buyerDelete, supervisorDelete, supplierDelete };