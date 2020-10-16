let mongoose = require('mongoose');
let Schema = mongoose.Schema;

let accountSchema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    creationDate: {
        type: Date,
        required: true,
        default: Date.now
    },
    allowNotifications: {
        type: Boolean,
        required: true,
        default: true
    }
})

module.exports = mongoose.model('account', accountSchema);