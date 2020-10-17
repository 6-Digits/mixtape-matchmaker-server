let mongoose = require('mongoose');
let Schema = mongoose.Schema;

let mixtapeSchema = new Schema({
    name: {
        type: String,
        default: ""
    },
    description: {
        type: String,
        default: ""
    },
    public: {
        type: String,
        default: false
    },
    views: {
        type: Number,
        default: 0
    },
    songList: {
        type: Array,
        default: 0
    },
    owner: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'account'
    },
    hearts: {
        type: Number,
        required: true,
        default: 0
    },
    comments: {
        type: Schema.Types.Array,
        default: []
    },
    match: {
        type: Boolean,
        default: false
    }
})

module.exports = mongoose.model('mixtape', mixtapeSchema);