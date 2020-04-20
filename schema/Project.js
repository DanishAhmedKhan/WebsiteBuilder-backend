const mongoose = require('mongoose');
const config = require('config');
const jwt = require('jsonwebtoken')

const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

const projectSchema = new Schema({
    user: {
        type: ObjectId,
        ref: 'User'
    },
    name: String,
    domain: String,
    type: Number,
    pages: [{
        _id: false,
        id: String,
        name: String,
        html: String,
        style: String,
        sections: [{
            _id: false,
            id: String,
            htmlId: String,
            parentClass: String,
            url: String,
        }],
    }],
    buttons: [{
        _id: false,
        id: String,
        name: String,
        html: String,
        style: String,
        property: [{
            _id: false,
            className: String,
            name: String,
            value: String,
        }],
    }],
    colors: [{
        _id: false,
        id: String,
        name: String,
        value: String,
    }],
    fonts: [{
        _id: false,
        name: String,
        value: String,
    }],
});

const Project = mongoose.model('Project', projectSchema);
module.exports = Project;