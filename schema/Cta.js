const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const ctaSchema = new Schema({
    html: String,
    style: String,
    description: String,
    parentClass: String,
    property: [{
        _id: false,
        className: String,
        name: String,
        value: String,
    }],
});

const Cta = mongoose.model('Cta', ctaSchema);
module.exports = Cta;