let mongoose = require('mongoose');
let Schema = mongoose.Schema;

let notificationSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'account'
    },
    message: {
        type: String,
        default: ""
    },
    link: {
        type: String,
        default: "http://localhost:8080/home"
    },
    time: {
        type: Date,
        required: true,
    },
    deleted: {
        type: Boolean,
        default: false
    }
})

module.exports = mongoose.model('notification', notificationSchema);