const express = require('express');
const Layout = require('../schema/Layout');
const Button = require('../schema/Button');
const Joi = require('joi');
const __ = require('./appUtil');

const router = express.Router();

const allLayout = async (req, res) => {
    const layouts = await Layout.find();

    res.status(200).send(__.success(layouts));
};  

const addLayout = async (req, res) => {
    const error = __.validate(req.body, {
        html: Joi.string().required(),
        description: Joi.string().required(),
        style: Joi.string().required(),
        thumbnail: Joi.object({
            url: Joi.string().required(),
            width: Joi.number().required(),
            height: Joi.string().required(),
        }),
    });
    if (error) return res.status(400).send(__.error.details[0].message);

    const layout = new Layout({
        html: req.body.html,
        description: req.body.description,
        style: req.body.style,
        thumbnail: req.body.thumbnail,
    });
    await layout.save();

    res.status(200).send(__.success(layout));
}

const updateLayoutThumbnail = async (req, res) => {
    const error = __.validate(req.body, {
        layoutId: Joi.string().required(),
        url: Joi.string().required(),
        width: Joi.number().required(),
        height: Joi.string().required(),
    });
    if (error) return res.status(400).send(__.error(error.details[0].message));

    await Layout.updateOne({ _id: req.body.layoutId }, {
        $set: { 
            thumbnail: { 
                url: req.body.url,
                width: req.body.width,
                height: req.body.height,
            } 
        }
    });

    res.status(200).send(__.success('Layout thumbnail updated'));
};

const updateLayoutCode = async (req, res) => {
    const error = __.validate(req.body, {
        layoutId: Joi.string().required(),
        html: Joi.string().required(),
        style: Joi.string().required(),
    });
    if (error) return res.status(400).send(__.error(error.details[0].message));

    await Layout.updateOne({ _id: req.body.layoutId }, {
        $set: { 
            html: req.body.html,
            style: req.body.style,
        }
    });

    res.status(200).send(__.success('Code updated'));
};

const allButton = async (req, res) =>{
    const buttons = await Button.find();

    res.status(200).send(__.success(buttons));
};

const addButton = async (req, res) => {
    const error = __.validate(req.body, {
        html: Joi.string().required(),
        style: Joi.string().required(),
        parentClass: Joi.string().required(),
        property: Joi.array().items(
            Joi.object({
                className: Joi.string().required(),
                name: Joi.string().required(),
                value: Joi.string().required(),
            })
        ),
    });
    if (error) return res.status(400).send(__.error(error.details[0].message));

    let button = new Button({
        html: req.body.html,
        style: req.body.style,
        parentClass: req.body.parentClass,
        property: req.body.property,
    });
    await button.save();

    res.status(200).send(__.success(button));
};  

const updateButtonCode = async (req, res) => {
    const error = __.validate(req,body, {
        buttonId: Joi.string().required(),
        html: Joi.string().required(),
        style: Joi.string().required(),
    });
    if (error) return res.status(400).send(__.error(error.details[0].message));

    await Button.updateOne({ _id: req.body.buttonId }, {
        $set: {
            html: req.body.html,
            style: req.body.style,
        }
    });

    res.status(200).send(__.success('Button code updated'));
}


router.post('/allLayout', allLayout);
router.post('/addLayout', addLayout);
router.post('/updateLayoutThumbnail', updateLayoutThumbnail);
router.post('/updateLayoutCode', updateLayoutCode);
router.post('/allButton', allButton);
router.post('/addButton', addButton);
router.post('/updateButtonCode', updateButtonCode);


module.exports = router;