let mongoose = require('mongoose');
let Schema = mongoose.Schema;

let commentSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        required: true
    },
    mixtape: {
        type: Schema.Types.ObjectId,
        required: true
    },
    date: {
        type: Date,
        default: Date.now()
    },
    text: {
        type: String,
        default: ""
    }
})

module.exports = mongoose.model('comment', commentSchema);