const express = require('express');
const bcrypt = require('bcryptjs');;
const Joi = require('joi');
const auth = require('../middleware/auth');
const User = require('../schema/User');
const Project = require('../schema/Project');
const __ = require('./appUtil');

const router = express.Router();

const validString = Joi.string().required();


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

const forgotPassword = async (req, res) => {
    const error = __.validate(req.body, {
        email: validString,
    });
    if (error) return res.status(400).send(__.error(error.details[0].message));


};

const resetPassword = async (req, res) =>{
    const error = __.validate(req.body, {
        email: validString,
        password: validString,
    });
    if (error) return res.status(400).send(__.error(error.details[0].message));
}

const addProject = async (req, res) => {
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

const getAllProjectMinimized = async (req, res) => {
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
            };

            newPages.push(newPage);
        }

        let ctas = project.ctas || [];
        let newCtas = [];
        for (let j = 0; j < ctas.length; j++) {
            let newCta = {
                id: buttons[j].id,
                name: buttons[j].name,
            }

            newCtas.push(newCta);
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

const deleteProject = async (req, res) => {
    const error = __.validate(req.body, {
        projectId: Joi.string().required(),
    });
    if (error) return res.status(400).send(__.error(error.details[0].message));

    const { user } = await Project.findOne({ _id: req.body.projectId }, 'user');

    await Project.deleteOne({ _id: req.body.projectId });

    await User.updateOne({ _id: user }, {
        $pull: { 
            projects: { id: req.body.projectId }
        }
    });

    res.status(200).send(__.success('Project deleted'));
}

const addPage = async (req, res) => {
    const error = __.validate(req.body, {
        projectId: Joi.string().required(),
        pageId: Joi.string().required(),
        pageName: Joi.string().required(),
    });
    if (error) return res.status(400).send(__.error(error.details[0].message));

    let { pages } = await Project.findOne({ _id: req.body.projectId }, 'pages');
    for (let i = 0; i < pages.length; i++) {
        if (pages[i].name == req.body.pageName) {
            res.status(400).send(__.error(`Page with the name ${req.body.pageName} alrady exist`));
        }
    }

    let page = {
        id: req.body.pageId,
        name: req.body.pageName,
        sections: [],
        html: '',
        style: '',
    }

    await Project.updateOne({ _id: req.body.projectId }, {
        $push: { pages: page },
    });

    res.status(200).send(__.success('Page added'));
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

const getAllPage = async (req, res) => {
    const error = __.validate(req.body, {
        projectId: validString,
    });
    if (error) return res.status(400).send(__.error(error.details[0].message));

    const { pages } = await Project.findOne({ _id: req.body.projectId }, 'pages');

    res.status(200).send(__.success(pages));
};

const updatePage = async (req, res) => {
    const error = __.validate(req.body, {
        projectId: Joi.string().required(),
        pageId: Joi.string().required(),
        html: Joi.string().allow(''),
        style: Joi.string().allow(''),
        sections: Joi.array().items(
            Joi.object({
                id: Joi.string().required(),
                htmlId: Joi.string().required(),
                parentClass: Joi.string().required(),
                url: Joi.string().required(),
            })
        )
    });
    if (error) return res.status(400).send(__.error(error.details[0].message));

    let sections = req.body.sections;
    if (sections == null) 
        sections = [];

    await Project.updateOne({ _id: req.body.projectId, 'pages.id': req.body.pageId }, {
        $set: {
            'pages.$.html': req.body.html,
            'pages.$.style': req.body.style,
            'pages.$.sections': sections,
        }
    });

    res.status(200).send(__.success('Page updated'));
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

    res.status(200).send(__.success('Page renamed'));
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

    res.status(200).send(__.success("page deleted"));
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

const addCta = async (req, res) => {
    const error = __.validate(req.body, {
        projectId: Joi.string().required(),
        ctaId: Joi.string().required(),
        ctaName: Joi.string().required(),
        ctaHtml: Joi.string().required(),
        ctaStyle: Joi.string().required(),
        ctaProperty: Joi.array().items(
            Joi.object({
                className: Joi.string().required(),
                name: Joi.string().required(),
                value: Joi.string().required(),
            }), 
        ),
    });
    if (error) return res.status(400).send(__.error(error.details[0].message));

    let { ctas } = await Project.findOne({ _id: req.body.projectId }, 'ctas');
    for (let i = 0; i < ctas.length; i++) {
        if (ctas[i].name == req.body.ctaName) {
            res.status(400).send(__.error(`Cta with the name ${req.body.ctaName} alrady exist`));
        }
    }
 
    let cta = {
        id: req.body.ctaId,
        name: req.body.ctaName,
        html: req.body.ctaHtml,
        style: req.body.ctaStyle,
        property: req.body.ctaProperty,
    };

    await Project.updateOne({ _id: req.body.projectId }, {
        $push: { ctas: cta }
    });
    
    res.status(200).send(__.success('Cta added'));
};

const updateCta = async (req, res) => {
    const error = __.validate(req.body, {
        projectId: Joi.string().required(),
        ctaId: Joi.string().required(),
        ctaName: Joi.string().required(),
        ctaHtml: Joi.string().required(),
        ctaStyle: Joi.string().required(),
        ctaProperty: Joi.array().items(
            Joi.object({
                className: Joi.string().required(),
                name: Joi.string().required(),
                value: Joi.string().required(),
            }), 
        ),
    });
    if (error) return res.status(400).send(__.error(error.details[0].message));

    let { ctas } = await Project.findOne({ _id: req.body.projectId }, 'ctas');
    for (let i = 0; i < ctas.length; i++) {
        if (ctas[i].name == req.body.ctaName) {
            res.status(400).send(__.error(`Cta with the name ${req.body.ctaName} alrady exist`));
        }
    }

    await Project.updateOne({ _id: req.body.projectId, 'ctas.id': req.body.ctaId }, {
        $set: {
            'ctas.$.name': req.body.ctaName,
            'ctas.$.html': req.body.ctaHtml,
            'ctas.$.style': req.body.ctaStyle,
            'ctas.$.property': req.body.ctaProperty,
        }
    });

    res.status(200).send(__.success('Cta updated'));
};

const getCtaStyle = async (req, res) => {
    const error = __.validate(req.body, {
        projectId: Joi.string().required(),
    });
    if (error) return res.status(400).send(__.error(error.details[0].message));

    let { ctas } = await Project.findOne({ _id: req.body.projectId }, 'ctas');

    let ctaStyle = '.btndef { display: inline-block; cursor: pointer; background-color: #a1479f; padding: 10px 16px; }';
    for (let i = 0; i < ctas.length; i++) {
        ctaStyle += ' ' + ctas[i].style;
    }

    res.status(200).send(__.success(ctasStyle));
};

const getCta = async (req, res) => {
    const error = __.validate(req.body, {
        projectId: Joi.string().required(),
        ctaId: Joi.string().required(),
    });
    if (error) return res.status(400).send(__.error(error.details[0].message));

    const cta = await Project.findOne({ 
        _id: req.body.projectId, 
        'ctas.id': req.body.ctaId 
    }, 'ctas.$');

    res.status(200).send(__.success(cta));
};

const getAllCta = async (req, res) => {
    const error = __.validate(req.body, {
        projectId: validString,
    });
    if (error) return res.status(400).send(__.error(error.details[0].message));

    const { ctas } = await Project.findOne({ _id: req.body.projectId }, 'ctas');

    res.status(200).send(__.success(ctas));
};

const deleteCta = async (req, res) => {
    const error = __.validate(req.body, {
        projectId: Joi.string().required(),
        ctaId: Joi.string().required(),
    });
    if (error) return res.status(400).send(__.error(error.details[0].message));

    await Project.updateOne({ _id: req.body.projectId }, {
        $pull: { ctas: { id: req.body.ctaId } }
    });

    res.status(200).send(__.success('Cta deleted'));
};

const addColor = async (req, res) => {
    const error = __.validate(req.body, {
        projectId: Joi.string().required(),
        colorId: Joi.string().required(),
        colorValue: Joi.string().required(),
    });
    if (error) return res.status(400).send(__.error(error.details[0].message));

    // Form the color object
    let color = {
        id: req.body.colorId,
        value: req.body.colorValue,
    };

    // Add the new color to the project
    await Project.updateOne({ _id: req.body.projectId }, {
        $push: { colors: color }
    });

    res.status(200).send(__.success('Color added'));
};

const updateColor = async (req, res) => {
    const error = __.validate(req.body, {
        projectId: Joi.string().required(),
        colorId: Joi.string().required(),
        colorValue: Joi.string().required(),
    });
    if (error) return res.status(400).send(__.error(error.details[0].message));

    let projectId = req.body.projectId;
    let colorId = req.body.colorId;
    let newColor = req.body.colorValue;

    // Update the project with the new project 
    // And return the pages and colors
    let {pages, ctas, colors} = await Project.findOneAndUpdate({ 
        _id: projectId, 
        'colors.id': colorId 
    }, {
        $set: {
            'colors.$.value': newColor,
        }
    }, {
        fields: {
            pages: 1, 
            ctas: 1,
            colors: 1,
        }
    });

    console.log(pages);
    console.log(ctas);
    console.log(colors);

    // Get the old color
    let oldColor;
    for (let i = 0; i < colors.length; i++) {
        if (colors[i].id == colorId) {
            oldColor = colors[i].value;
            break;
        }
    }

    let oldColorFontTag = `<font color="${oldColor}">`;
    let newColorFontTag = `<font color="${newColor}">`;

    // Update each page html reflecting the new color change
    for (let i = 0; i < pages.length; i++) {
        let page = pages[i];
        let html = page.html;
        html.replace(oldColorFontTag, newColorFontTag);

        // Update the page html
        await Project.updateOne({ _id: projectId, 'pages.id': page.id }, {
            $set: {
                'pages.$.html': html,
            }
        });
    }

    // Update button property w
    for (let i = 0; i < ctas.length; i++) {
        let cta = ctas[i];
        let property = cta.property;
        for (let j = 0; j < property.length; j++) {
            if (property[j].value.indexOf(oldColor) >= 0) {
                property[j].value.replace(oldColor, newColor);
            }
        }

        // Update the button property
        await Project.updateOne({ _id: projectId, 'ctas.id': cta.id }, {
            $set: {
                'ctas.$.property': property,
            }
        });
    }

    res.status(200).send(__.success('Color updated'));
};

const getAllColor = async (req, res) => {
    const error = __.validate(req.body, {
        projectId: Joi.string().required(),
    });
    if (error) return res.status(400).send(__.error(error.details[0].message));

    const { colors } = await Project.findOne({ _id: req.body.projectId }, 'colors');

    res.status(200).send(__.success(colors));
};

const getColor = async (req, res) => {
    const error = __.validate(req.body, {
        projectId: validString,
        colorId: validString,
    });
    if (error) return res.status(400).send(__.error(error.details[0].message));

    const color = await Project.findOne({ 
        _id: req.body.projectId, 
        'colors.id': req.body.colorId 
    }, 'colors.$');

    res.status(200).send(__.success(color));
};

const deleteColor = async (req, res) => {
    const error = __.validate(req.body, {
        projectId: Joi.string().required(),
        colorId: Joi.string().required(),
    });
    if (error) return res.status(400).send(__.error(error.details[0].message));

    await Project.updateOne({ _id: req.body.projectId }, {
        $pull: { 
            colors: { id: req.body.colorId } 
        }
    });

    return res.status(200).send(__.success('Color deleted'));
};

const addFont = async (req, res) => {
    const error = __.validate(req.body, {
        projectId: Joi.string().required(),
        fontId: Joi.string().required(),
        fontValue: Joi.string().required(),
    });
    if (error) return res.status(400).send(__.error(error.details[0].message));

    // The font object
    let font = {
        id: req.body.fontId,
        value: req.body.fontValue,
    };

    // Add the new font to the project
    await Project.updateOne({ _id: req.body.projectId }, {
        $push: { fonts: font }
    });

    res.status(200).send(__.success('Font added'));
};

const updateFont = async (req, res) => {
    const error = __.validate(req.body, {
        projectId: Joi.string().required(),
        fontId: Joi.string().required(),
        fontValue: Joi.string().required(),
    });
    if (error) return res.status(400).send(__.error(error.details[0].message));

    let projectId = req.body.projectId;
    let fontId = req.body.fontId;
    let newFont = req.body.fontValue;

    // Update the project with the new project 
    // And return the pages and colors
    let {pages, ctas, colors} = await Project.findOneAndUpdate({ 
        _id: projectId, 
        'fonts.id': colorId 
    }, {
        $set: {
            'fonts.$.value': newFont,
        }
    }, {
        fields: {
            pages: 1, 
            ctas: 1,
            colors: 1,
        }
    });

    res.status(200).send(__.success('Font updated'));
};

const getAllFont = async (req, res) => {
    const error = __.validate(req.body, {
        projectId: Joi.string().required(),
    });
    if (error) return res.status(400).send(__.error(error.details[0].message));

    const { fonts } = await Project.findOne({ _id: req.body.projectId }, 'fonts');

    res.status(200).send(__.success(fonts));
};

const getFont = async (req, res) => {
    const error = __.validate(req.body, {
        projectId: validString,
        fontId: validString,
    });
    if (error) return res.status(400).send(__.error(error.details[0].message));

    const font = await Project.findOne({ 
        _id: req.body.projectId, 
        'fonts.id': req.body.fontId 
    }, 'fonts.$');

    res.status(200).send(__.success(font));
};

const deleteFont = async (req, res) => {
    const error = __.validate(req.body, {
        projectId: Joi.srring().required(),
        fontId: Joi.string().required(),
    });
    if (error) return res.status(400).send(__.error(error.details[0].message));

    await Project.updateOne({ _id: req.body.projectId }, {
        $pull: { fonts: { id: req.body.fontId } }
    });

    return res.status(200).send(__.success('Font deleted'));
};

router.post('/signup', signup);
router.post('/login', login);
router.post('/forgotPassword', forgotPassword);
router.post('/resetPassword', resetPassword);

router.post('/addProject', auth, addProject);
router.post('/getProject', auth, getProject);
router.post('/getAllProject', auth, getAllProjects);
router.post('/renameProject', auth, renameProject);
router.post('/deleteProject', auth, deleteProject);

router.post('/addPage', auth, addPage);
router.post('/getPage', auth, getPage);
router.post('/updatePage', auth, updatePage);
router.post('/renamePage', auth, renamePage);
router.post('/deletePage', auth, deletePage);
router.post('/saveSection', auth, saveSection);

router.post('/addCta', auth, addCta);
router.post('/updateCta', auth, updateCta);
router.post('/getCtaStyle', auth, getCtaStyle);
router.post('/getCta', auth, getCta);
router.post('/deleteCta', auth, deleteCta);

router.post('/addColor', auth, addColor);
router.post('/updateColor', auth, updateColor);
router.post('/getAllColor', auth, getAllColor);
router.post('/getColor', auth, getColor)
router.post('/deleteColor', auth, deleteColor);

router.post('/addFont', auth, addFont);
router.post('/updateFont', auth, updateFont);
router.post('/getAllFont', auth, getAllFont);
router.post('/getFont', auth, getFont);
router.post('/deleteFont', auth, deleteFont);

module.exports = router;