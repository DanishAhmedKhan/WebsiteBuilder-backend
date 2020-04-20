const mongoose = require('mongoose');
const config = require('config');
const jwt = require('jsonwebtoken')

const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

const layoutSchema = new Schema({
    html: String,
    description: String,
    style: String,
    parentClass: String,
    thumbnail: {
        url: String,
        width: Number,
        height: Number,
    },
});

const Layout = mongoose.model('Layout', layoutSchema);
module.exports = Layout;