const mongoose = require('mongoose');
const config = require('config');
const jwt = require('jsonwebtoken')

const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

const userSchema = new Schema({
    email: {
        type: String, 
    },
    password: {
        type: String,
    },
    name: {
        type: String,
    },
    projects: [{
        name: String,
        id: {
            type: ObjectId,
        },
        _id: false,
    }]
});

userSchema.methods.generateAuthToken = function() {
    return jwt.sign({ _id: this._id }, config.get('userAuthToken'));
};

const User = mongoose.model('User', userSchema);
module.exports = User;