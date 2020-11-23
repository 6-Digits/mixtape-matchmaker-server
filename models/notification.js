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
    link:{
        type: String,
        default: "http://localhost:8080/home"
    },
    time: {
        type: Date,
        required: true,
        default: Date.now()
    }
})

module.exports = mongoose.model('notification', notificationSchema);