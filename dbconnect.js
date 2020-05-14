const mongoose = require("mongoose");
mongoose.Promise = require("bluebird");
const url = "mongodb+srv://root:UNITEROOT@unite-cluster-afbup.mongodb.net/UNITEDB";
const connect = mongoose.connect(url, { useNewUrlParser: true });
module.exports = connect;