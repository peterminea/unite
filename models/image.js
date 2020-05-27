'use strict';

const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ImageSchema = new Schema({
  logEntryId: {
    type: mongoose.Schema.ObjectId,
    required: true
  },  
  path: {
    type: String,
    required: true
  },
  label: {
    type: String,
    required: true
  },  
  createdAt: {
    type: Date,
    default: Date.now
  }
  
});

module.exports = mongoose.model('Image', ImageSchema);