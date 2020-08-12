const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const regionSchema = new Schema({
  name: {
      type: String,
      required: true
    }
  });

module.exports = mongoose.model('Region', regionSchema);//Areas covered