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
const { getObjectMongoose } = require('../middleware/getData');
const BannedUser = require('../models/bannedUser');


const verifyBanNewUser = async (req, res, email, ip) => {
  let obj = await getObjectMongoose('BannedUser', { $or: [ { email: email }, { ip: ip } ] });
  console.log(obj);
  
  if(obj && obj.banExpiryDate > Date.now()) {
    res.status(400).send({
      msg: 'Banned user!'
    });
  }
};

const verifyBanExistingUser = async (req, res, doc, ip) => {
  let obj = await getObjectMongoose('BannedUser', { $or: [ { email: doc.emailAddress }, { ip: ip }, { userId: doc._id } ] });
  console.log(obj);
  
  if(obj && obj.banExpiryDate > Date.now()) {
    res.status(400).send({
      msg: 'Banned user!'
    });
  }
};


module.exports = { verifyBanNewUser, verifyBanExistingUser };