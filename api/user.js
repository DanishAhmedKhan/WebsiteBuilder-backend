const express = require('express');
const bcrypt = require('bcryptjs');;
const Joi = require('joi');
const auth = require('../middleware/auth');
const User = require('../schema/User');
const Project = require('../schema/Project');
const Button = require('../schema/Button');
const __ = require('./appUtil');

const router = express.Router();

const signup = async (req, res) => {
    const error = __.validate(req.body, {
        email: Joi.string().email().required(),
        password: Joi.string().required(),
    });
    if (error) return res.status(400).send(__.error(error.details[0].message));

    let user = await User.findOne({ email: req.body.email });
    if (user) return res.status(400).send(__.error('Email already registered'));

    user = {
        email: req.body.email,
        password: req.body.password,
    };

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);

    const newUser = new User(user);
    await newUser.save();
    const authToken = newUser.generateAuthToken();

    res.header('x-user-auth-token', authToken)
       .status(200)
       .send(__.success(authToken));
};

const login = async (req, res) => {
    const error = __.validate(req.body, {
        email: Joi.string().email().required(),
        password: Joi.string().required(),
    }); 
    if (error) return res.status(400).send(__.error(error.details[0].message));

    let user = await User.findOne({email: req.body.email }, 'password');
    if (!user) return res.status(400).send(__.error('This email is not registered'));

    const validPassword = await bcrypt.compare(req.body.password, user.password);
    if (!validPassword) return res.status(400).send(__.error('Invalid password'));

    const authToken = user.generateAuthToken();
    res.header('x-user-auth-token', authToken)
       .status(200)
       .send(__.success(authToken));
};

const newProject = async (req, res) => {
    const error = __.validate(req.body, {
        projectName: Joi.string().required(),
        domainName: Joi.string().required(),
    });
    if (error) return res.status(400).send(__.error(error.details[0].message));

    const newProject = new Project({
        user: req.user._id,
        name: req.body.projectName,
        domain: req.body.domainName,
    });
    await newProject.save();

    await User.updateOne({ _id: req.user._id }, {
        $push: {
            projects: {
                name: req.body.projectName,
                id: newProject._id,
            }
        }
    });

    res.status(200).send(__.success(newProject));
};

const getProject = async(req, res) => {
    const error = __.validate(req.body, {
        projectId: Joi.string().required(),
    });
    if (error) return res.status(400).send(__.error(error.details[0].message));

    let project = await Project.findOne({ _id: req.body.projectId });

    res.status(200).send(__.success(project));
};

const getAllProjects = async (req, res) => {
    let projects = [];

    const user = await User.findOne({ _id: req.user._id }, 'projects');
    const projectIds = user.projects;

    for (let i = 0; i < projectIds.length; i++) {
        let project = await Project.findOne({ _id: projectIds[i].id });

        let pages = project.pages || [];
        let newPages = [];
        for (let j = 0; j < pages.length; j++) {
            let newPage = {
                id: pages[j].id,
                name: pages[j].name,
            }

            newPages.push(newPage);
        }

        let buttons = project.buttons || [];
        let newButton = [];
        for (let j = 0; j < buttons.length; j++) {
            let newButton = {
                id: buttons[j].id,
                name: buttons[j].name,
            }
        }

        let newProject = {
            id: project._id,
            name: project.name,
            domain: project.domain,
            pages: newPages,
            buttons: newButton,
        };

        projects.push(newProject);
    }

    res.status(200).send(__.success(projects));
};

const renameProject = async (req, res) => {
    const error = __.validate(req.body, {
        projectId: Joi.string().required(),
        projectName: Joi.string().required(),
    });
    if (error) return res.status(400).send(__.error(error.details[0].message));

    await User.updateOne({ _id: req.body.projectId }, {
        $set: { name: req.body.projectName }
    });

    res.status(200).send(__.success('Project renamed'));
};

const addPage = async (req, res) => {
    const error = __.validate(req.body, {
        projectId: Joi.string().required(),
        pageName: Joi.string().required(),
    });
    if (error) return res.status(400).send(__.error(error.details[0].message));

    let page = {
        id: __.generateId(20),
        name: req.body.pageName,
        sections: [],
        html: '',
        style: '',
    }

    await Project.updateOne({ _id: req.body.projectId }, {
        $push: { pages: page }
    });

    res.status(200).send(__.success(page));
};

const getPage = async (req, res) => {
    const error = __.validate(req.body, {
        projectId: Joi.string().required(),
        pageId: Joi.string().required(),
    });
    if (error) return res.status(400).send(__.error(error.details[0].message));

    const page = await Project.findOne({ 
        _id: req.body.projectId, 
        'pages.id': req.body.pageId,
    }, 'pages.$');

    res.status(200).send(__.success(page));
};

const updatePageCode = async (req, res) => {
    const error = __.validate(req.body, {
        projectId: Joi.string().required(),
        pageId: Joi.string().required(),
        html: Joi.string().required(),
        style: Joi.string().required(),
    });
    if (error) return res.status(400).send(__.error(error.details[0].message));

    await Project.updateOne({ _id: req.body.projectId, 'pages.id': req.body.pageId }, {
        $set: {
            'pages.$.html': req.body.html,
            'pages.$.style': req.body.style,
        }
    });

    res.status(200).send(__.success('Page code updated'));
};

const renamePage = async (req, res) => {
    const error = __.validate(req.body, {
        projectId: Joi.string().required(),
        pageId: Joi.string().required(),
        pageName: Joi.string().required(),
    });
    if (error) return res.status(400).send(__.error(error.details[0].message));

    await User.updateOne({ _id: req.body.projectId, 'pages.id': req.body.pageId }, {
        $set: {
            'pages.$.name': req.body.pageName,
        }
    });

    res.status(200).send(__.success('Project renamed'));
};

const deletePage = async (req, res) => {
    const error = __.validate(req.body, {
        projectId: Joi.string().required(),
        pageId: Joi.string().required(),        
    });
    if (error) return res.status(400).send(__.error(error.details[0].message));

    await Project.updateOne({ _id: req.body.projectId }, {
        $pull: { 
            pages: { id: req.body.pageId } 
        }
    });

    res.status(200).send(__.success('Page seleated'));
};

const saveSection = async (req, res) => {
    const error = __.validate(req.body, {
        projectId: Joi.string().required(),
        pageId: Joi.string().required(),
        sections: Joi.array().items(
            Joi.object({
                id: Joi.string().required(),
                htmlId: Joi.string().required(),
                url: Joi.string().required(),
                code: Joi.string().required(),
                style: Joi.array().items({
                    className: Joi.string().required(),
                    value: Joi.string().required(),
                }),
                property: Joi.array().items({
                    
                }),
            })
        ),
    });
    if (error) return res.status(400).send(__.error(error.details[0].message));

    await Project.updateOne({ _id: req.body.projectId, 'pages.id': req.body.pageId }, {
        $set: { 'pages.$.sections': [] }
    });

    await Project.updateOne({ _id: req.body.projectId, 'pages.id': req.body.pageId }, {
        $push: {
            'pages.$.sections': { $each: req.body.sections } // req.body.sections[0], 
        }       
    });

    res.status(200).send(__.success('Section added'));
};

const addButton = async (req, res) => {
    const error = __.validate(req.body, {
        projectId: Joi.string().required(),
        name: Joi.string().required(),
        html: Joi.string().required(),
        style: Joi.string().required(),
        property: Joi.array().items(
            Joi.object({
                className: Joi.string().required(),
                name: Joi.string().required(),
                value: Joi.string().required(),
            }), 
        ),
    });
    if (error) return res.status(400).send(__.error(error.details[0].message));

    let button = {
        id: __.generateId(20),
        name: req.body.name,
        html: req.body.html,
        style: req.body.style,
        property: req.body.property,
    };

    await Project.updateOne({ _id: req.body.projectId }, {
        $push: { buttons: button }
    });

    res.status(200).send(__.success(button));
};

const updateButton = async (req, res) => {
    const error = __.validate(req.body, {
        projectId: Joi.string().required(),
        buttonId: Joi.string().required(),
        name: Joi.string().required(),
        html: Joi.string().required(),
        style: Joi.string().required(),
        property: Joi.array().items(
            Joi.object({
                className: Joi.string().required(),
                name: Joi.string().required(),
                value: Joi.string().required(),
            }), 
        ),
    });
    if (error) return res.status(400).send(__.error(error.details[0].message));

    await Project.updateOne({ _id: req.body.projectId, 'buttons.id': req.body.buttonId }, {
        $set: {
            'buttons.$.name': req.body.name,
            'buttons.$.html': req.body.html,
            'buttons.$.style': req.body.style,
            'buttons.$.property': req.body.property,
        }
    });

    res.status(200).send(__.success('Button updated'));
};

const deleteButton = async (req, res) => {
    const error = __.validate(req.body, {
        projectId: Joi.string().required(),
        buttonId: Joi.string().required(),
    });
    if (error) return res.status(400).send(__.error(error.details[0].message));

    await Project.updateOne({ _id: req.body.projectId }, {
        $pull: { buttons: { id: req.body.buttonId } }
    });

    res.status(200).send(__.success('Button deleted'));
};

const addColor = async (req, res) => {
    const error = __.validate(req.body, {
        projectId: Joi.string().required(),
        name: Joi.string().required(),
        color: Joi.string().required(),
    });
    if (error) return res.status(400).send(__.error(error.details[0].message));

    let color = await Project.findOne({ _id: req.body.projectId, 'colors.name': req.body.name }, '_id');
    if (color) return res.status(400).send(__.error('Color with this name already esist'));

    color = {
        id: generateId(20),
        name: req.body.name,
        value: req.body.color
    };

    await Project.updateOne({ _id: req.body.projectId }, {
        $push: { colors: color }
    });

    res.status(200).send(__.success(color));
};

const editColor = async (req, res) => {
    const error = __.validate(req.body, {
        projectId: Joi.string().required(),
        colorId: Joi.string().required(),
        name: Joi.string().required(),
        color: Joi.string().required(),
    });
    if (error) return res.status(400).send(__.error(error.details[0].message));

    await Project.updateOne({ _id: req.body.projectId, 'colors.id': req.body.colorId }, {
        $set: {
            'colors.$.name': req.body.name,
            'colors.$.value': req.body.color,
        }
    });

    res.status(200).send(__.success('Color updated'));
};

const deleteColor = async (req, res) => {
    const error = __.validate(req.body, {
        projectId: Joi.srring().required(),
        colorId: Joi.string().required(),
    });
    if (error) return res.status(400).send(__.error(error.details[0].message));

    await Project.updateOne({ _id: req.body.projectId }, {
        $pull: { colors: { id: req.body.colorId } }
    });

    return res.status(200).send(__.success('Color deleted'));
};

const addFont = async (req, res) => {
    const error = __.validate(req.body, {
        projectId: Joi.string().required(),
        name: Joi.string().required(),
        font: Joi.string().required(),
    });
    if (error) return res.status(400).send(__.error(error.details[0].message));

    let font = await Project.findOne({ _id: req.body.projectId, 'fonts.name': req.body.name }, '_id');
    if (font) return res.status(400).send(__.error('Font with this name already esist'));

    font = {
        id: generateId(20),
        name: req.body.name,
        value: req.body.font
    };

    await Project.updateOne({ _id: req.body.projectId }, {
        $push: { fonts: font }
    });

    res.status(200).send(__.success(font));
};

const editFont = async (req, res) => {
    const error = __.validate(req.body, {
        projectId: Joi.string().required(),
        fontId: Joi.string().required(),
        name: Joi.string().required(),
        font: Joi.string().required(),
    });
    if (error) return res.status(400).send(__.error(error.details[0].message));

    await Project.updateOne({ _id: req.body.projectId, 'fonts.id': req.body.fontId }, {
        $set: {
            'fonts.$.name': req.body.name,
            'fonst.$.value': req.body.font,
        }
    });

    res.status(200).send(__.success('Font updated'));
};

const deleteFont = async (req, res) => {
    const error = __.validate(req.body, {
        projectId: Joi.srring().required(),
        fontId: Joi.string().required(),
    });
    if (error) return res.status(400).send(__.error(error.details[0].message));

    await Project.updateOne({ _id: req.body.projectId }, {
        $pull: { fonts: { id: req.body.colorId } }
    });

    return res.status(200).send(__.success('Font deleted'));
};

router.post('/signup', signup);
router.post('/login', login);
router.post('/addProject', auth, newProject);
router.post('/getProject', auth, getProject);
router.post('/getAllProject', auth, getAllProjects);
router.post('/renameProject', auth, renameProject);
router.post('/addPage', auth, addPage);
router.post('/getPage', auth, getPage);
router.post('/renamePage', auth, renamePage);
router.post('/deletePage', auth, deletePage);
router.post('/saveSection', auth, saveSection);
router.post('/addButton', auth, addButton);
router.post('/updateButton', auth, updateButton);
router.post('/deleteButton', auth, deleteButton);
router.post('/addColor', auth, addColor);
router.post('/editColor', auth, editColor);
router.post('/deleteColor', auth, deleteColor);
router.post('/addFont', auth, addFont);
router.post('/editFont', auth, editFont);
router.post('/deleteFont', auth, deleteFont);

module.exports = router;