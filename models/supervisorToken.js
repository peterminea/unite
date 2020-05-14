const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const tokenSchema = new mongoose.Schema({
    _userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Supervisor' 
    },
    token: { 
      type: String, 
      required: true 
    },
    createdAt: { 
      type: Date, 
      required: true, 
      default: Date.now, 
      expires: 86400 
    }
});


module.exports = mongoose.model('SupervisorToken', tokenSchema);