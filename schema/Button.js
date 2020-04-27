const mongoose = require('mongoose');
const config = require('config');
const jwt = require('jsonwebtoken')

const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

const buttonSchema = new Schema({
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

const Button = mongoose.model('Button', buttonSchema);
module.exports = Button;