let mongoose = require('mongoose');
let Schema = mongoose.Schema;

let chatSchema = new Schema({
    user1: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'account'
    },
    user2: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'account'
    },
    messages: {
        type: Schema.Types.Array,
        default: []
    },
    creationDate: {
        type: Date,
        required: true,
        default: Date.now
    }
})

module.exports = mongoose.model('chat', chatSchema);