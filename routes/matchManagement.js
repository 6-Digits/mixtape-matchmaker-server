const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const preferences = require('../models/preference');
const VerifyToken = require('../authentication/verifyToken');

router.use(bodyParser.urlencoded({ extended: true }));

// Gets a single user-preference from the database
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

// Updates a single user-preference from the database
router.post('/id/:id', /*VerifyToken(),*/ async (req, res) => {
	await preferences.findByIdAndUpdate(req.params.id, req.body, function (err, user) {
		if (err) {
			return res.status(500).send("There was a problem getting data from the DB.");
		}else if(!user){
			return res.status(404).send("No user found.");
		}else{
			res.status(200).send(user);
		}
	});
})

// Gets an entire list of matched users
router.get('/matchList', /*VerifyToken(),*/ async (req, res) => {
    res.status(404).send("To be implemented")
})

// TODO: Actual Matching Algorithmn
router.post('/matching', /*VerifyToken(),*/ async (req, res) => {
    return res.status(404).send("Matching Algorithmn not implemented")
})

module.exports = router;