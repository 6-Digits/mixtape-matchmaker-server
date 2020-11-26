const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const preferences = require('../models/preference');
const chats = require('../models/chat');
const messages = require('../models/message');
const VerifyToken = require('../authentication/verifyToken');

const Promise = require('bluebird');
const mixtape = require('../models/mixtape');
router.use(bodyParser.urlencoded({ extended: true }));

// Gets a single user-preference from the database
// http://localhost:42069/api/match/id/:id
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
// http://localhost:42069/api/match/id/:id
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

// Gets the single match-mixtape based on the user's id
// http://localhost:42069/api/match/mixtape/uid/:uid
router.get('/mixtape/uid/:uid', /*VerifyToken(),*/ async (req, res) => {
	await mixtape.findOne({owner : req.params.uid, match: true}).then((matchMixtape)=>{
		if (!matchMixtape){
			return res.status(404).send("No match mixtape found.")
		}
		return res.status(200).send(matchMixtape)
	}).catch((error)=>{
		console.log(error)
		return res.status(500).send("Error in getting match mixtape.")
	})
})

// Sets the match-mixtape based on the mixtape id
// http://localhost:42069/api/match/mixtape/mid/:mid
router.post('/mixtape/mid/:mid', /*VerifyToken(),*/ async (req, res) => {
	await mixtapes.findByIdAndUpdate(req.params.mid, {
		name: req.body.name,
		description: req.body.description,
		songList: req.body.songList,
	}, { new: true }).then(async (result) => {
		if (!result) {
			return res.status(404).send("There is a problem with creating the mixtape.");
		}
		return res.status(200).send(result);
	}).catch((error) => {
		console.log(error);
		return res.status(500).send("There is a problem with the database.");
	});
})

// Get all the chats that the user is part of
// http://localhost:42069/api/match/chat/uid/:uid
router.get('/chat/uid/:uid', async (req, res) => {
	await chats.find({$or: [{user1 : req.params.uid}, {user2 : req.params.uid}]}).then((chatList)=>{
		if (!chatList){
			return res.status(404).send("No chat found.")
		}
		let requests = chatList.map((chat) => {
			return new Promise(async (resolve) => {
				let messageList = chat.messages;
				chat['messages'] = [];
				let messagePromise = Promise.each(messageList, async (messageID) => {
					await messages.findById(messageID).then((messageDB) => {
						chat['messages'].push(messageDB)
					}).catch((error) => {
						console.log(error);
						return res.status(500).send("DB error")
					})
				})
				resolve(messagePromise);
			}).catch((error)=>{
				console.log(error);
			})
		})
		Promise.all(requests).then(() => {
			return res.status(200).send(chatList);
		}).catch((error) => {
			console.log(error);
			return res.status(500).send("Promise error, good luck.")
		})
	}).catch((error) => {
		console.log(error);
		return res.status(500).send("There is a problem with finding the mixtape.");
	})
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