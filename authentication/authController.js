require('dotenv').config()
const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');

const verifyToken = require('./verifyToken');

router.use(bodyParser.urlencoded({ extended: false }));
router.use(bodyParser.json());
const accounts = require('../models/account');
const profiles = require('../models/profile');

const jwt = require('jsonwebtoken'); // used to create, sign, and verify tokens
const bcrypt = require('bcryptjs');
const mixtapes = require('../models/mixtape');
const preferences = require('../models/preference');
const matches = require('../models/match')

// http://localhost:42069/api/auth/login
router.post('/login', async (req, res) => {
    await accounts.findOne({ email: req.body.email }, (err, user) => {
        if (err) {
            return res.status(500).send('Error on the server.');
        } else if (!user) {
            return res.status(404).send('No user found.');
        }

        // check if the password is valid
        let passwordIsValid = bcrypt.compareSync(req.body.password, user.password);
        if (!passwordIsValid) return res.status(401).send({ auth: false, token: null });

        // if user is found and password is valid
        // create a token
        let token = jwt.sign({ id: user._id }, process.env.KEY, {
            expiresIn: 86400 // expires in 24 hours
        });

        // return the information including token as JSON
        res.status(200).send({ auth: true, token: token, id: user._id });
    });

});
// http://localhost:42069/api/auth/logout
router.get('/logout', async (req, res) => {
    res.status(200).send({ auth: false, token: null });
});
// http://localhost:42069/api/auth/register
router.post('/register', async (req, res) => {
    //console.log("registering user");
    let hashedPassword = bcrypt.hashSync(req.body.password, 8);
    let token = null;
    //console.log("Creating account.")
    await accounts.create({
        email: req.body.email,
        password: hashedPassword
    }).then(async (result) => {
        // if user is registered without errors
        // create a token
        token = jwt.sign({ id: result._id }, process.env.KEY, {
            expiresIn: 86400 // expires in 24 hours
        });
        let name = `${req.body.firstName} ${req.body.lastName}`;
        //console.log(req.body);
        //console.log("Creating profile.")
        await mixtapes.create({
            owner: result._id,
            match: true
        }).then(async (matchMixtape) => {
            await profiles.create({
                _id: result._id,
                name: name,
                userName: name,
                gender: req.body.gender,
                dob: req.body.dob,
                matchPlaylist: matchMixtape._id
            }).then(async (result) => {
                await preferences.create({ _id : result._id }).then(async (preferenceDB) => {
                    await matches.create({_id : result._id}).then(async(matchDB)=>{
                        return res.status(200).send({ auth: true, token: token, id: result._id });
                    }).catch((error)=>{
                        console.log(error)
                        return res.status(500).send("Error in creating default match for user")
                    })
                }).catch((error) => {
                    console.log(error)
                    return res.status(500).send("Error in creating a preferences")
                })
            }).catch((error) => {
                console.log(error)
                return res.status(500).send("Error in creating a match mixtape")
            })
        }).catch((error) => {
            console.log(error)
            return res.status(500).send("Error creating profile in database")
        });
    }).catch((error) => {
        console.log(error)
        return res.status(500).send("There was a problem registering the user`.");
    })
});

// http://localhost:42069/api/auth/me
router.get('/me', verifyToken, async (req, res, next) => {
    await accounts.findById(req.userId, { password: 0 },
        (err, user) => {
            if (err) {
                return res.status(500).send("There was a problem finding the user.");
            }
            if (!user) {
                return res.status(404).send("No user found.");
            }
            res.status(200).send(user);
        });
});

router.post('/resetPassword', async (req, res) => {
    if (req.body.email == '') {
        res.status(400).send('No email provided');
    }
    let password = process.env.RESET_PASSWORD;
    let hashedPassword = bcrypt.hashSync(password, 8);

    await accounts.findOneAndUpdate({ email: req.body.email },
        { password: hashedPassword },
        (err, user) => {
            if (err || !user) {
                return res.status(404).send('No user found.');
            }

            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: `${process.env.EMAIL_ADDRESS}`,
                    pass: `${process.env.EMAIL_PASSWORD}`
                }
            });
            const mailOptions = {
                from: `${process.env.EMAIL_ADDRESS}`,
                to: `${user.email}`,
                subject: 'Mixtape Matchmaker Password Reset',
                text: `Your password has been reset. \n\n Your new password is: ${password} \n\n Please login and change this immediately.`
            };
            transporter.sendMail(mailOptions, (err, info) => {
                if (err) {
                    return res.status(500).send('Error on the server.');
                }
                res.status(200).send('password reset, email sent');
            })
        });
})

module.exports = router;