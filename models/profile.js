let mongoose = require('mongoose');
let Schema = mongoose.Schema;

let profileSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    userName: {
        type: String,
        required: true
    },
    gender: {
        type: String,
        default: ""
    },
    dob: {
        type: Date,
    },
    description: {
        type: String,
        default: ""
    },
    profileLikes: {
        type: Map,
        default: {}
    },
    profileDislikes: {
        type: Map,
        default: {}
    },
    mixtapeHearts: {
        type: Map,
        default: {}
    },
    mixtapeViews: {
        type: Map,
        default: {}
    },
    imgSrc: {
        type: String,
        default: ""
    },
    matchPlaylist: {
        type: Schema.Types.ObjectId,
        required: true
    }
})

module.exports = mongoose.model('profile', profileSchema);