let mongoose = require('mongoose');
let Schema = mongoose.Schema;

let matchSchema = new Schema({
    matches: {
        type: Array,
        required: true,
        default: []
    }
})

module.exports = mongoose.model('match', matchSchema);