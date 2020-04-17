const mongoose = require('mongoose');
const config = require('config');
const jwt = require('jsonwebtoken')

const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

const property = {
    type: String,
    default: '-',
}

const cssProperty = {
    display: property,
    cursor: property,
    color: property,
    fontSize: property,
    fontFamily: property,
    background: property,
    backgroundColor: property,
    float: property,
    padding: property,
    paddingLeft: property,
    paddingTop: property,
    paddingRight: property,
    paddingBottom: property,
    border: property,
    borderLeft: property,
    borderTop: property,
    borderRight: property,
    borderBottom: property,
    borderWidth: property,
    borderStyle: property,
    borderRadius: property,
    borderTopLeft: property,
    borderTopRight: property,
    borderBottomLeft: property,
    borderBottomRight: property,
    transform: property,
    transition: property,
}

const buttonSchema = new Schema({
    code: String,
    style: String,
    description: String,
    // style: [{
    //     _id: false, 
    //     className: String,
    //     value: String,
    // }],
    property: [{
        _id: false,
        className: String,
        name: String,
        value: String,
    }],
});

const Button = mongoose.model('Button', buttonSchema);
module.exports = Button;