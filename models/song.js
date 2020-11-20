let mongoose = require('mongoose');
let Schema = mongoose.Schema;

let songSchema = new Schema({
    title: {
        type: String,
        default: ""
    },
    author: {
        type: String,
        default: ""
    },
    apiType: {
        type: String,
        default: ""
    },
    url: {
        type: String,
        default: ""
    },
    videoId: {
        type: String,
        default: ""
    },
    views: {
        type: Number,
        default: 0
    },
    language: {
        type: String,
        default: ""
    },
    imgUrl: {
        type: String,
        default: ""
    },
    duration: {
        type: Number,
        default: 0
    },
    genre: {
        type: Array,
        default: []
    }
})

module.exports = mongoose.model('song', songSchema);