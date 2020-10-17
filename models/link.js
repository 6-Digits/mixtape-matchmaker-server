let mongoose = require('mongoose');
let Schema = mongoose.Schema;

let linkSchema = new Schema({
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
    creationDate: {
        type: Date,
        required: true,
        default: Date.now
    },
    terminationDate: {
        type: Date
    }
})

module.exports = mongoose.model('link', linkSchema);