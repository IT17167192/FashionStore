const User = require("../models/users");
const jwt = require('jsonwebtoken');//token generation
const request = require('request');
const expressJwt = require('express-jwt');//auth check
const {errorHandler} = require('../helpers/dbErrorHandler');
const nodemailer = require('nodemailer');
const hbs = require('nodemailer-express-handlebars');
const Handlebars = require('handlebars');

exports.signup = (req, res) => {
    const user = new User(req.body);
    user.save((err, user) => {
        if (err) {
            return res.status(400).json({error: errorHandler(err)});
        }
        user.salt = undefined;
        user.hash_password = undefined;
        res.json({
            user
        });

        if (typeof req.body.role !== 'undefined' && req.body.role === 2) {
            let transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.EMAIL,
                    pass: process.env.PASSWORD
                }
            });

            transporter.use('compile', hbs({
                viewEngine: {
                    extName: '.handlebars',
                    partialsDir: './email_views/',
                    layoutsDir: './email_views/',
                    defaultLayout: '',
                },
                viewPath: './email_views/',
                extName: '.handlebars',
            }));

            let emailOptions = {
                from: process.env.EMAIL,
                to: req.body.email,
                cc: process.env.EMAIL,
                subject: 'New account details',
                template: 'email_view',
                context: {
                    username: req.body.email,
                    password: req.body.password,
                    name: req.body.name
                }
            };

            transporter.sendMail(emailOptions, function (err, success) {
                if (err) {
                    console.log(err);
                } else {
                    console.log("Email sent successfully");
                }
            });
        }
    });
};

exports.signin = (req, res) => {
    //find the user based on email
    const {email, password} = req.body;
    User.findOne({email}, (err, user) => {
        if (err || !user) {
            return res.status(400).json({error: 'User does not exist!'});
        }
        //authenticate the user
        if (!user.auth(password)) {
            return res.status(401).json({
                error: 'Incorrect credentials!'
            });
        }
        //authenticate the user
        if (user.state === '0') {
            return res.status(401).json({
                error: "Inactive User. Access denied!"
            });
        }

        //if authenticated generate a token with uid and secret
        const token = jwt.sign({_id: user._id}, process.env.JWT_SECRET);
        //add to cookie with expiry date
        res.cookie('t', token, {expire: new Date() + 9999});
        //return user and token to the front-end client
        const {_id, name, email, role} = user;
        return res.json({token, user: {_id, name, email, role}});
    })
};

exports.signout = (req, res) => {
    res.clearCookie('t');
    res.status(200).json({message: 'Signout success!'})
};

//signin check middleware
exports.requiredSignin = expressJwt({secret: process.env.JWT_SECRET, userProperty: "auth"});

//authentication middleware
exports.isAuth = (req, res, next) => {
    console.log(req);
    let user = req.profile && req.auth && req.profile._id == req.auth._id;
    if (!user) {
        return res.status(403).json({
            error: "Access denied"
        });
    }

    next();
};

//authentication middleware
exports.isAuthCheckForAdminOperations = (req, res, next) => {
    let user = req.adminProfile && req.auth && req.adminProfile._id == req.auth._id;
    if (!user) {
        return res.status(403).json({
            error: "Access denied"
        });
    }

    next();
};

//admin routes authentication middleware
exports.isAdmin = (req, res, next) => {
    if (req.profile.role === "0" || req.profile.role === "2") {
        return res.status(403).json({
            error: "Not a admin. Access denied!"
        });
    }

    next();
};

//admin routes authentication middleware
exports.isAdminCheckForResetPassword = (req, res, next) => {
    if (req.adminProfile.role === "0" || req.adminProfile.role === "2") {
        return res.status(403).json({
            error: "Not a admin. Access denied!"
        });
    }

    next();
};

//store manager routes authentication middleware
exports.isStoreManager = (req, res, next) => {
    if (req.profile.role === "0") {
        return res.status(403).json({
            error: "Not a admin. Access denied!"
        });
    }

    if (req.profile.role === "1" || req.profile.role === "2") {
        next();
    }
};

exports.changeState = (req, res) => {
    User.findOneAndUpdate({_id: req.body._id}, {state: req.body.state}, {new: true}, (err, user) => {
        if (err) {
            return res.status(400).json({
                error: 'Unauthorized Action!'
            })
        }

        user.hashed_password = undefined;
        user.salt = undefined;

        res.json(user);
    });
};

exports.newsletterSignUp = (req, res) => {
    const email = req.body.email;
    console.log(email);
    if (!email) {
        return res.status(401).json({
            error: "Email required"
        });
    }

    const data = {
        members: [{
            email_address: email,
            status: '3',
        }]
    };

    const postData = JSON.stringify(data);

    const options = {
        url: 'https://us18.api.mailchimp.com/3.0/lists/21eefe5bcb',
        method: 'POST',
        headers: {
            Authorization: 'auth 70cf7b8e9292591bcbc47201fb4a387b-us18'
        },
        body: postData
    };

    request(options, (err, response, body) => {
        if (err) {
            return res.status(401).json({
                error: "Error in network connection!"
            });
        } else {
            if (response.statusCode = 200) {
                res.json(body);
            } else {
                return res.status(401).json({
                    error: "Error in network connection!"
                });
            }
        }
    });
}
