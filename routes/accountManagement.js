const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const accounts = require('../models/account');
const verifyToken = require('../authentication/verifyToken');
const bcrypt = require('bcryptjs');

router.use(bodyParser.urlencoded({ extended: true }));

// Gets a single user from the database
// http://localhost:42069/api/account/id/:id
router.get('/id/:id', async (req, res) => {
	await accounts.findById(req.params.id, function (err, user) {
		if (err) {
			return res.status(500).send("There was a problem adding the information to the database.");
		} else if (!user) {
			return res.status(404).send("No user found.");
		} else {
			res.status(200).send(user);
		}
	});
})

// Updates a single user in the database
// http://localhost:42069/api/account/id/:id
router.post('/id/:id', /*verifyToken,*/ async (req, res) => {
	//console.log(req.body)
	await accounts.findOne({_id: req.params.id}, async (err, dbUser) => {
		if (err) {
			return res.status(500).send("There was a problem adding the information to the database.");
		} else if (!dbUser) {
			return res.status(404).send("No user found.");
		} else {
			let passwordIsValid = bcrypt.compareSync(req.body.oldPassword, dbUser.password);
			delete req.body['oldPassword'];
			if (passwordIsValid) {
				if (req.body.password != null){
					let hashedPassword = bcrypt.hashSync(req.body.password, 8);
					req.body.password = hashedPassword;
				}
				await accounts.findByIdAndUpdate(req.params.id, req.body, { new: true }, function (err, user) {
					if (err) {
						return res.status(500).send("There was a problem adding the information to the database.");
					} else if (!user) {
						return res.status(404).send("No user found.");
					} else {
						delete user['password'];
						res.status(200).send(user);
					}
				});
			} else {
				res.status(400).send("Wrong password!");
			}
		}
	});
})


module.exports = router;