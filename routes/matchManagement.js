const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const preferences = require('../models/preference');
const VerifyToken = require('../authentication/verifyToken');

router.use(bodyParser.urlencoded({ extended: true }));

// Gets a single user-profile from the database
router.get('/id/:id', /*VerifyToken(),*/ async (req, res) => {
	await preferences.findById(req.params.id, function (err, user) {
		if (err) {
			return res.status(500).send("There was a problem getting data from the DB.");
		}else if(!user){
			return res.status(404).send("No user found.");
		}else{
			res.status(200).send(user);
		}
	});
})