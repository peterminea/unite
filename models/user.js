const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const userSchema = new Schema({
    discordId: {
        type: String,
        required: true
    },
    username: {
        type: String,
        required: true
    },
    discrim: {
        type: String,
        required: true
    },
    mfa: {
        type: Boolean,
        required: true 
    },
    avatar: {
        type: String,
        required: false
    }
});

module.exports = mongoose.model('User', userSchema);