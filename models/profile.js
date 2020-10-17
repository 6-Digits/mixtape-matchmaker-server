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
        required: true
    },
    description: {
        type: String,
        default: ""
    },
    profileLikes: {
        type: [Schema.Types.ObjectId],
        default: []
    },
    profileDislikes: {
        type: [Schema.Types.ObjectId],
        default: []
    },
    mixtapeHearts: {
        type: Array
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