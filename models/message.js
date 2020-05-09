const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const messageSchema = new Schema({
    from: {
        type: Schema.Types.ObjectId,
        required: true
    },
    to: {
        type: Schema.Types.ObjectId,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    sender: {
        type: String,
        required: true
    },
    time: {
        type: Date,
        default: Date.now
    },
    bidRequestId: {
        type: Schema.Types.ObjectId,
        required: true
    }
});

module.exports = mongoose.model('Message', messageSchema);