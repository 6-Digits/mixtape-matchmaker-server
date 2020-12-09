require('dotenv').config();
const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const axios = require('axios');
const Promise = require('bluebird');

const preferences = require('../models/preference');
const chats = require('../models/chat');
const profiles = require('../models/profile');
const messages = require('../models/message');
const mixtapes = require('../models/mixtape');
const songs = require('../models/song');
const prelinks = require('../models/prelink')
const links = require('../models/link')
const matches = require('../models/match')
const VerifyToken = require('../authentication/verifyToken');

const tf = require('@tensorflow/tfjs');
require('@tensorflow/tfjs-node'); // CPU computation
const use = require('@tensorflow-models/universal-sentence-encoder');
const { resolve } = require('bluebird');
const { profile } = require('@tensorflow/tfjs');

router.use(bodyParser.urlencoded({ extended: true }));

// Gets a single user-preference from the database
// http://localhost:42069/api/match/id/:id
router.get('/id/:id', /*VerifyToken(),*/ async (req, res) => {
	await preferences.findById(req.params.id, function (err, user) {
		if (err) {
			return res.status(500).send("There was a problem getting data from the DB.");
		} else if (!user) {
			return res.status(404).send("No user found.");
		} else {
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
		} else if (!user) {
			return res.status(404).send("No user found.");
		} else {
			res.status(200).send(user);
		}
	});
})

// Gets the single match-mixtape based on the user's id
// http://localhost:42069/api/match/mixtape/uid/:uid
router.get('/mixtape/uid/:uid', /*VerifyToken(),*/ async (req, res) => {
	await mixtapes.findOne({ owner: req.params.uid, match: true }).then((mixtape) => {
		if (!mixtape) {
			return res.status(404).send("No match mixtape found.")
		}
		let songList = mixtape.songList;
		mixtape['songList'] = [];
		let songPromise = Promise.each(songList, async (songID) => {
			await songs.findById(songID).then((songDB) => {
				mixtape['songList'].push(songDB)
			}).catch((error) => {
				console.log(error);
				return res.status(500).send("DB error")
			})
		}).catch((error) => {
			console.log(error)
			return res.status(500).send("DB error")
		})
		Promise.all(songPromise).then(() => {
			return res.status(200).send(mixtape)
		})

	}).catch((error) => {
		console.log(error)
		return res.status(500).send("Error in getting match mixtape.")
	})
})

// Sets the match-mixtape based on the mixtape id
// http://localhost:42069/api/match/mixtape/mid/:mid
router.post('/mixtape/mid/:mid', /*VerifyToken(),*/ async (req, res) => {
	//console.log(req.body)
	//console.log(req.params.mid)
	await mixtapes.findByIdAndUpdate(req.params.mid, {
		name: req.body.name,
		description: req.body.description,
		songList: req.body.songList,
	}, { new: true }).then(async (result) => {
		//console.log(result)
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
	await chats.find({ $or: [{ user1: req.params.uid }, { user2: req.params.uid }] }).then((chatList) => {
		if (!chatList) {
			return res.status(404).send("No chat found.")
		}
		chatList = JSON.parse(JSON.stringify(chatList));
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
				// Sets the recipient ID
				let recipientID = req.params.uid !== chat.user1 ? chat.user1 : chat.user2;
				await profiles.findById(recipientID).then((profileDB) => {
					chat['recipient'] = profileDB;
					// console.log("Setting recipient")
					resolve(messagePromise);
				}).catch((error) => {
					console.log(error)
				})
			}).catch((error) => {
				console.log(error);
			})
		})
		Promise.all(requests).then(() => {
			//console.log(chatList)
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

// Gets a single user-preference JSON from the database
// http://localhost:42069/api/match/preference/uid/:uid
router.get('/preference/uid/:uid', /*VerifyToken(),*/ async (req, res) => {
	await preferences.findById(req.params.uid, function (err, user) {
		if (err) {
			return res.status(500).send("There was a problem getting data from the DB.");
		} else if (!user) {
			return res.status(404).send("No user found.");
		} else {
			res.status(200).send(user);
		}
	});
})

// Updates a single user=preference in the database
// http://localhost:42069/api/match/preference/uid/:uid
router.post('/preference/uid/:uid', /*VerifyToken(),*/ async (req, res) => {
	if (req.body.ageLower < 18) {
		return res.status(500).send("FBI OPEN UP!!!")
	}
	await preferences.findByIdAndUpdate(req.params.uid, req.body, { new: true }).then((preferenceDB) => {
		if (!preferenceDB) {
			return res.status(404).send("No preference for this user found.")
		}
		return res.status(200).send(preferenceDB)
	}).catch((error) => {
		console.log(error)
		return res.status(500).send("Error in updating the preferences.")
	})
})

// Gets an entire list of matched users
router.get('/matchList', /*VerifyToken(),*/ async (req, res) => {
	res.status(404).send("To be implemented")
})

// Gets an entire list of possible matches for the user
router.get('/compatible/uid/:uid', async (req, res) => {
	// Restrictions in the possible matches to be implemented later
	await profiles.find({}).then((profileList) => {
		if (!profileList) {
			return res.status(404).send("No compatible profile found.")
		}
		profileList = JSON.parse(JSON.stringify(profileList));
		let requests = profileList.map((profile) => {
			return new Promise(async (resolve) => {
				await mixtapes.findOne({ _id: profile.matchPlaylist, match: true }).then((mixtape) => {
					profile['matchPlaylist'] = mixtape;
					//console.log(profile)
				}).catch((error) => {
					console.log(error)
				})
				resolve()
			}).catch((error) => {
				console.log(error);
			})
		})
		Promise.all(requests).then(() => {
			//console.log(profileList)
			return res.status(200).send(profileList);
		}).catch((error) => {
			console.log(error);
			return res.status(500).send("Promise error, good luck.")
		})
	}).catch((error) => {
		console.log(error);
		return res.status(500).send("Profile DB error.")
	})
})
// Gives back an array of prelinks
router.get('/prelinks/uid/:uid', async (req, res) => {
	await prelinks.find({ $or: [{ user: req.params.uid }, { liker: req.params.uid }] }).then((result) => {
		if (!result) {
			return res.status(400).send("No prelinks for this user.")
		}
		return res.status(200).send(result)
	}).catch((error) => {
		console.log(error)
		return res.status(500).send("Error in prelinks DB.")
	})
})
// Deletes prelink
router.post('/prelink/plid/:plid', async (req, res) => {
	await links.findByIdAndDelete(req.params.plid).then((result) => {
		if (!result) {
			return res.status(400).send("No prelinks for this user.")
		}
		return res.status(200).send(result)
	}).catch((error) => {
		console.log(error)
		return res.status(500).send("Error in prelinks DB.")
	})
})

// Gives back an array of links
router.get('/links/uid/:uid', async (req, res) => {
	await links.find({ $or: [{ user1: req.params.uid }, { user2: req.params.uid }] }).then((result) => {
		if (!result) {
			return res.status(400).send("No links for this user.")
		}
		return res.status(200).send(result)
	}).catch((error) => {
		console.log(error)
		return res.status(500).send("Error in links DB.")
	})
})

// Deletes link
router.post('/link/lid/:lid', async (req, res) => {
	await links.findByIdAndDelete(req.params.lid).then((result) => {
		if (!result) {
			return res.status(400).send("No links for this user.")
		}
		return res.status(200).send(result)
	}).catch((error) => {
		console.log(error)
		return res.status(500).send("Error in links DB.")
	})
})

// Gets all the matches for that user
router.get('/matches/uid/:uid', async (req, res) => {
	await matches.findById(req.params.uid).then(async (matchDB) => {
		let returnValue = []
		if (!matchDB) {
			return res.status(404).send("No match in DB")
		} else if (matchDB.matches.length < 1) {
			return res.status(404).send("No matches yet, need to run algo.")
		}
		let matchList = matchDB.matches;
		Promise.each(matchList, async (userID) => {
			let matchTemp = {};
			let mixtapeTemp = [];
			await mixtapes.findOne({ owner: userID, match: true }).then(async (mixtapeDB) => {
				matchTemp['mixtapeDescription'] = mixtapeDB.description;
				matchTemp['mixtapeName'] = mixtapeDB.name
				let songList = mixtapeDB.songList;
				let songPromise = Promise.each(songList, async (songID) => {
					await songs.findById(songID).then((songDB) => {
						mixtapeTemp.push(songDB)
					}).catch((error) => {
						console.log(error);
						return res.status(500).send("DB error")
					})
				})
				// Stupid but it works
				await songPromise
				matchTemp['songList'] = mixtapeTemp;
				await profiles.findById(userID).then((profileDB) => {
					matchTemp['_id'] = userID
					matchTemp['gender'] = profileDB.gender
					matchTemp['imgSrc'] = profileDB.imgSrc
					matchTemp['name'] = profileDB.name
					matchTemp['userName'] = profileDB.userName
				}).catch((error) => {
					console.log(error)
					return res.status(500).send("Profile Error.")
				})
				returnValue.push(matchTemp)
				//console.log(returnValue)
			}).catch((error) => {
				console.log(error)
				return res.status(500).send("Error in finding mixtape.")
			})
		}).then(async (result) => {
			// Finished all items in matchList
			//console.log(result)
			return res.status(200).send(returnValue);
		}).catch((error) => {
			console.log(error)
			return res.status(500).send("Promise Error")
		})
	}).catch((error) => {
		console.log(error)
		return res.status(500).send("Error in finding matchDB.")
	})
})

router.get('/geocode/:query', async (req, res) => {
	const url = `https://www.google.com/maps/search/${req.params.query}`;

	axios.get(url).then((response) => {
		try {
			let data = response.data;
			let match = data.match(/@-?\d+\.?\d*,-?\d+\.?\d*/)[0].substring(1);
			let coordinates = match.split(',').map(x => +x);
			return res.status(200).send({ geocode: coordinates });
		}
		catch (exception) {
			console.log('Invalid location');
			return res.status(400).send('Invalid location');
		}
	}).catch((error) => {
		console.log(error.message);
		return res.status(500).send(error.message);
	});
})

// TODO: Actual Matching Algorithm
router.get('/matching', async (req, res) => {
	const uid = '5fc2ee3de3281f26881e1915';
	let prefsResult = await axios.get(`${process.env.SERVER_API}/match/id/${uid}`);
	let mixtapeResult = await axios.get(`${process.env.SERVER_API}/match/mixtape/uid/${uid}`);
	let prefs = prefsResult.data;
	let mixtape = mixtapeResult.data;
	let genres = mixtape['songList'].map(x => x['genre'])

	use.load().then(async (model) => {
		let scores = [];

		for (genre of genres) {
			const embeddings = await model.embed(genre);
			const score = tf.mean(embeddings, 0);
			scores.push(score);
		}

		scores = tf.stack(scores);
		const embedding = tf.mean(scores, 0);

		return res.status(200).send({ embeddings: embedding, tensor: embedding.arraySync() });
	}).catch((error) => {
		console.log(error);
		return res.status(500).send(error.message)
	});
})

module.exports = router;