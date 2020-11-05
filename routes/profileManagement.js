const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const accounts = require('../models/account');
const profiles = require('../models/profile');
const VerifyToken = require('../authentication/verifyToken');
const bcrypt = require('bcryptjs');
router.use(bodyParser.urlencoded({ extended: true }));

// Gets a single user-preference JSON from the database
router.get('/id/:id', /*VerifyToken(),*/ async (req, res) => {
	await profiles.findById(req.params.id, function (err, user) {
		if (err) {
			return res.status(500).send("There was a problem getting data from the DB.");
		} else if (!user) {
			return res.status(404).send("No user found.");
		} else {
			res.status(200).send(user);
		}
	});
})

// Updates a single user-preference in the database
router.post('/id/:id', VerifyToken, async (req, res) => {
	let user1;
	await accounts.findById(req.params.id, function (err, user) {
		return user, err;
	}).then(async (result) => {
		let passwordIsValid = bcrypt.compareSync(req.body.password, result.password);
		if (passwordIsValid) {
			await profiles.findByIdAndUpdate(req.params.id, result, function (err, user) {
				if (err) {
					return res.status(500).send("There was a problem accessing to the database.");
				} else if (!user) {
					return res.status(404).send("No user found.");
				}
				return res.status(200).send(user);
			})
		} else {
			return res.status(401).send("Wrong password");
		}
	}).catch((error)=>{
		console.log(error);
	})
})

module.exports = router;