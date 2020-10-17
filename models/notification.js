let mongoose = require('mongoose');
let Schema = mongoose.Schema;

let notificationSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'acccount'
    },
    message: {
        type: String,
        default: ""
    },
    time: {
        type: Date,
        required: true,
        default: Date.now
    }

})

module.exports = mongoose.model('notification', notificationSchema);