const {
  basicFormat,
  customFormat,
  normalFormat
} = require("../middleware/dateConversions");

const async = require("async");
const MongoClient = require("mongodb").MongoClient;
const ObjectId = require("mongodb").ObjectId;
const URL = process.env.MONGODB_URI, BASE = process.env.BASE;
const treatError = require("../middleware/treatError");
const search = require("../middleware/searchFlash");
const internalIp = require('internal-ip');


const verifyBanNewUser = (req, res, email, ip) => {
  MongoClient.connect(URL, { useUnifiedTopology: true }, async function(err, db) {
    if(treatError(req, res, err, "back")) 
      return false;    

    let dbo = db.db(BASE);
    
    let filter = { $or: [ { email: email }, { ip: ip } ] };
    
    dbo.collection('bannedusers').findOne(filter, (err, obj) => {
      if(treatError(req, res, err, "back")) 
        return false; 
      
      if(obj && obj.banExpiryDate > Date.now()) {
        db.close();
        res.status(400).send({
          msg: 'Banned user!'
        });
      }
    });    
    
    db.close;
  });
};

const verifyBanExistingUser = (dbo, req, res, doc, ip) => {
  let filter = { $or: [ { email: doc.emailAddress }, { ip: ip }, { userId: doc._id } ] };
  
  dbo.collection('bannedusers').findOne(filter, (err, obj) => {
    if(treatError(req, res, err, "back")) 
      return false; 

    if(obj && obj.banExpiryDate > Date.now()) {
      dbo.close();
      res.status(400).send({
        msg: 'Banned user!'
      });
    }
  });  
};


module.exports = { verifyBanNewUser, verifyBanExistingUser };