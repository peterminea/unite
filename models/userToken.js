const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userTokenSchema = new mongoose.Schema({
    _userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    userType: {
      type: String,
      required: true
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

userTokenSchema.index({_userId: 1, userType: 1}, {unique: true});
module.exports = mongoose.model('UserToken', userTokenSchema);