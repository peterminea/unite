const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const capabilitySchema = new Schema({
  capabilityDescription: {
    type: String,
    unique: true,
    required: true
  },  
  supplier: {
    type: Schema.Types.ObjectId, // Supplier's object id -> It will be generated from current session
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now()
  },
  updatedAt: {
    type: Date,
    default: Date.now()
  }
});

capabilitySchema.index({capabilityDescription: 1, supplier: 1}, {unique: true});
module.exports = mongoose.model('Capability', capabilitySchema);