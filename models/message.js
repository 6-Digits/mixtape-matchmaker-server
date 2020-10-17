let mongoose = require('mongoose');
let Schema = mongoose.Schema;

let messageSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'account'
    },
    text: {
        type: String,
        default: ""
    },
    date: {
        type: Date,
        required: true,
        default: Date.now
    }
})

module.exports = mongoose.model('message', messageSchema);