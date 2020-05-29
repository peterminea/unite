const mongoose = require("mongoose");
const process = require('process');
//mongoose.Promise = require("bluebird");

const connect = mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true }
);

module.exports = connect;