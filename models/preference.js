let mongoose = require('mongoose');
let Schema = mongoose.Schema;

let preferenceSchema = new Schema({
    gender: {
        type: String,
        default: ""
    },
    ageUpper: {
        type: Number,
        required: true,
        default: 2147483647
    },
    ageLower: {
        type: Number,
        required: true,
        default: 18
    },
    location: {
        type: String,
        default: ""
    },
    geocode: {
        type: Array,
        default: [0.0, 0.0]
    }
})

module.exports = mongoose.model('preference', preferenceSchema);