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
    views: {
        type: Number,
        default: 0
    },
    captions: {
        type: String,
        default: ""
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
        type: String,
        default: ""
    }
})

module.exports = mongoose.model('song', songSchema);