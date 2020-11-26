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
// http://localhost:42069/api/profile/id/:id
router.get('/id/:id', /*VerifyToken(),*/ async (req, res) => {
	//console.log(req.params.id);
	await profiles.findById(req.params.id).then((user) => {
		if (!user) {
			return res.status(404).send("No user found.");
		} else {
			res.status(200).send(user);
		}
	}).catch((error) => {
		console.log(error);
		return res.status(500).send("There was a problem getting data from the DB.");
	});
})

// Depreciated
// Updates a single user-preference in the database
// For the frontend, note that you would have to make two calls for the settings page
// First to update the profile, and Second to update the account settings if needed
// http://localhost:42069/api/profile/id/:id
router.post('/id/:id', /*VerifyToken(),*/ async (req, res) => {
	let user1;
	await accounts.findById(req.params.id).then(async (result) => {
		let passwordIsValid = bcrypt.compareSync(req.body.password, result.password);
		if (passwordIsValid) {
			/*Assumes that the old password is embedded into the JSON object*/
			delete req.body['password']
			await profiles.findByIdAndUpdate(req.params.id, req.body, { new: true }).then((user) => {
				if (!user) {
					return res.status(404).send("No user found.");
				}
				return res.status(200).send(user);
			}).catch((error) => {
				//console.log(error);
				return res.status(500).send("There was a problem accessing to the database.1");
			})
		} else {
			return res.status(401).send("Wrong password");
		}
	}).catch((error) => {
		//console.log(error);
		return res.status(500).send("There was a problem with the database.3");
	})
})


// Updates both account and profile settings at the same time.
// Should use this instead of the depreciated version above.
// http://localhost:42069/api/profile/uid/:id
router.post('/uid/:id', async (req, res) => {
	// Checks id every field is populated
	if (req.body.name && req.body.userName && req.body.dob && req.body.gender
		&& req.body.email && req.body.oldPassword && req.body.allowNotifications !== null) {
		await accounts.findById(req.params.id).then(async (result) => {
			if (!result){
				return res.status(404).send("No user account found.");
			}
			let passwordIsValid = bcrypt.compareSync(req.body.oldPassword, result.password);
			if (passwordIsValid) {
				let profile = {
					name: req.body.name,
					userName: req.body.userName,
					gender: req.body.gender,
					dob: req.body.dob,
				}
				if (req.body.imgSrc && req.body.imgSrc !== ""){
					profile['imgSrc'] = req.body.imgSrc;
				}
				let account = {
					email: req.body.email,
					allowNotifications: req.body.allowNotifications
				}
				// Checks if the password needs to be updated
				if (req.body.newPassword !== null){
					account['password'] = bcrypt.hashSync(req.body.newPassword, 8);
				}
				Promise.all([
					await profiles.findByIdAndUpdate(req.params.id, profile, { new : true }),
					await accounts.findByIdAndUpdate(req.params.id, account, { new : true })
				])
				.then(([returnProfile, returnAccount]) => {
					if (!returnProfile || !returnAccount) {
						return res.status(404).send("No user found.");
					}
					return res.status(200).send([returnProfile, returnAccount]);
				}).catch((error) => {
					console.log(error);
					return res.status(500).send("There was a problem accessing to the database.");
				});
			} else {
				return res.status(401).send("Wrong password");
			}
		}).catch((error) => {
			console.log(error);
			return res.status(500).send("There was a problem with the database.");
		})
	}
})

// Gets all notifications based on the user id
// http://localhost:42069/api/profile/notificatons/uid/:uid
router.get('/notifications/uid/:uid', async (req, res) => {
	await notifications.find({ user: req.params.uid }).then((result) => {
		if (!result) {
			return res.status(404).send("No user found.");
		}
		return res.status(200).send(result);
	}).catch((error) => {
		console.log(error);
		return res.status(500).send("There was a problem adding the information to the database.");
	})
})

// Note that calling this route sends back the delete operation
// http://localhost:42069/api/profile/notificatons/nid/:nid
router.post('/notifications/nid/:nid', async (req, res) => {
	await notifications.deleteOne({ _id: req.params.id }).then((result) => {
		if (!result) {
			return res.status(404).send("No user found.");
		}
		return res.status(200).send(result);
	}).catch((error) => {
		console.log(error);
		return res.status(500).send("There was a problem adding the information to the database.");
	})
})

module.exports = router;