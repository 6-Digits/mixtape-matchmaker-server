const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const accounts = require('../models/account');
const verifyToken = require('../authentication/verifyToken');
const bcrypt = require('bcryptjs');

router.use(bodyParser.urlencoded({ extended: true }));

// Gets a single user from the database
router.get('/id/:id', async (req, res) => {
	await accounts.findById(req.params.id, function (err, user) {
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
router.post('/id/:id', verifyToken, async (req, res) => {
	//let hashedPassword = bcrypt.hashSync(req.body.password, 8);
	await accounts.findByIdAndUpdate(req.params.id, req.body, {new: true}, function (err, user) {
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