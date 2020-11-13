const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const accounts = require('../models/account');
const profiles = require('../models/profile');
const notifications = require('../models/notification');
const VerifyToken = require('../authentication/verifyToken');
const bcrypt = require('bcryptjs');
router.use(bodyParser.urlencoded({ extended: true }));

// Gets a single user-preference JSON from the database
router.get('/id/:id', /*VerifyToken(),*/ async (req, res) => {
	//console.log(req.params.id);
	await profiles.findById(req.params.id).then((user) => {
		if (!user) {
			return res.status(404).send("No user found.");
		} else {
			res.status(200).send(user);
		}
	}).catch((error) =>{
		console.log(error);
		return res.status(500).send("There was a problem getting data from the DB.");
	});
})

// Gets a single user-preference JSON from the database
router.get('preference/id/:id', /*VerifyToken(),*/ async (req, res) => {
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
// For the frontend, note that you would have to make two calls for the settings page
// First to update the profile, and Second to update the account settings if needed
router.post('/id/:id', /*VerifyToken(),*/ async (req, res) => {
	let user1;
	await accounts.findById(req.params.id).then(async (result) => {
		let passwordIsValid = bcrypt.compareSync(req.body.password, result.password);
		if (passwordIsValid) {
			/*Assumes that the old password is embedded into the JSON object*/
			delete req.body['password']
			await profiles.findByIdAndUpdate(req.params.id, req.body, {new: true}).then((user)=>{
				if (!user) {
					return res.status(404).send("No user found.");
				}
				return res.status(200).send(user);
			}).catch((error)=>{
				//console.log(error);
				return res.status(500).send("There was a problem accessing to the database.1");
			})
		} else {
			return res.status(401).send("Wrong password");
		}
	}).catch((error)=>{
		//console.log(error);
		return res.status(500).send("There was a problem with the database.3");
	})
})

// Gets all notifications based on the user id
router.get('/notifications/id/:id', async (req, res) => {
	await notifications.find({ user: req.params.id}).then((result)=>{
		if(!result){
			return res.status(404).send("No user found.");
		}
		return res.status(200).send(result);
	}).catch((error)=>{
		console.log(error);
		return res.status(500).send("There was a problem adding the information to the database.");
	})
})

// Gets all notifications based on the notification id 
// Note that calling this route sends back the delete operation timestamped
router.post('/notifications/nid/:id', async (req, res) => {
	await notifications.deleteOne({ _id: req.params.id}).then((result)=>{
		if(!result){
			return res.status(404).send("No user found.");
		}
		return res.status(200).send(result);
	}).catch((error)=>{
		console.log(error);
		return res.status(500).send("There was a problem adding the information to the database.");
	})
})

module.exports = router;