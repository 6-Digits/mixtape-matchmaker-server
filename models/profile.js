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
        required: true
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
        default: []
    },
    profileDislikes: {
        type: Map,
        default: []
    },
    mixtapeHearts: {
        type: Array,
        default: []
    },
    imgSrc: {
        type: String,
        default: ""
    },
    matchPlaylist: {
        type: Schema.Types.ObjectId,
    }
})

module.exports = mongoose.model('profile', profileSchema);