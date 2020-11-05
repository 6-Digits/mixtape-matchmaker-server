const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const accounts = require('../models/account');
const VerifyToken = require('../authentication/verifyToken');
const bcrypt = require('bcryptjs');

router.use(bodyParser.urlencoded({ extended: true }));

// CREATES A NEW USER
router.post('/', async (req, res) => {
	let hashedPassword = bcrypt.hashSync(req.body.password, 8);
	accounts.create({
		email : req.body.email,
		password : hashedPassword,
		allowedNotifications : false
	},
	function (err, user) {
		if (err) {
			return res.status(500).send("There was a problem adding the information to the database.");
		}else {
			res.status(200).send(user);
		}
	});
})

// Gets a single user from the database
router.post('/id/:id', async (req, res) => {
	let hashedPassword = bcrypt.hashSync(req.body.password, 8);
	accounts.findById(req.params.id, function (err, user) {
		if (err) {
			return res.status(500).send("There was a problem adding the information to the database.");
		}else if(!user){
			return res.status(404).send("No user found.");
		}else{
			res.status(200).send(user);
		}
	});
})

// Updates a single user in the database
router.post('/id/:id', VerifyToken, async (req, res) => {
	let hashedPassword = bcrypt.hashSync(req.body.password, 8);
	accounts.findByIdAndUpdate(req.params.id, function (err, user) {
		if (err) {
			return res.status(500).send("There was a problem adding the information to the database.");
		}else if(!user){
			return res.status(404).send("No user found.");
		}else{
			res.status(200).send(user);
		}
	});
})

module.exports = router;