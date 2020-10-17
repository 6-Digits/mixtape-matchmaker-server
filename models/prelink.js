let mongoose = require('mongoose');
let Schema = mongoose.Schema;

let prelinkSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'account'
    },
    liker: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'account'
    },
    creationDate: {
        type: Date,
        required: true,
        default: Date.now
    }
})

module.exports = mongoose.model('prelink', prelinkSchema);