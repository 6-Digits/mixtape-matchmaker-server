const search = require('./search.js')
const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const accounts = require('../models/account');
const mixtapes = require('../models/mixtape');
const songs = require('../models/song');
const comments = require('../models/comment');
const verifyToken = require('../authentication/verifyToken');
const bcrypt = require('bcryptjs');

router.use(bodyParser.urlencoded({ extended: true }));

// Gets a single mixtape from the database based on their unique mixtape id
router.get('/id/:id', async (req, res) => {
	await mixtapes.findById(req.params.id, function (err, user) {
		if (err) {
			return res.status(500).send("There was a problem adding the information to the database.");
		} else if (!user) {
			return res.status(404).send("No user found.");
		} else {
			return res.status(200).send(user);
		}
	});
});

// Gets a list of mixtapes from the database based on their owner
router.get('/uid/:id', async (req, res) => {
	await mixtapes.find({ owner: req.params.id }).then(async (mixtapes) => {
		//console.log(mixtapes);
		if (!mixtapes) {
			return res.status(404).send("No mixtapes found.");
		}
		//console.log(mixtapes);
		let requests = mixtapes.map((mixtape) => {
			//console.log(mixtape)
			return new Promise(async (resolve) => {
				await songs.find({ _id: { $in: mixtape.songList } }).then(async (songs) => {
					mixtape['songList'] = songs ? songs : [];
					await comments.find({ _id: { $in: mixtape.comments } }).then((comments) => {
						mixtape['comments'] = comments ? comments : [];
						resolve(mixtape);
					}).catch((error) => {
						console.log(error)
						resolve(res.status(500).send("There was an error finding the comments."))
					});
				}).catch((error) => {
					console.log(error);
					resolve(res.status(500).send("There is a problem with finding the songs."))
				});
				resolve(mixtapes);
			});
		});
		Promise.all(requests).then((result) => {
			//console.log(result);
			return res.status(200).send(result);
		}).catch((error)=>{
			console.log(error);
			return res.status(500).send("Promise error, good luck.")
		})
	}).catch((error) => {
		console.log(error);
		return res.status(500).send("There is a problem with finding the mixtape.");
	});
})

// Gets a list of mixtapes from the database based their view count
router.get('/popular', async (req, res) => {
	await mixtapes.find({public : true}).sort({ views: -1 }).limit(20).then((mixtapes) => {
		//console.log(mixtapes);
		if (!mixtapes) {
			return res.status(404).send("No mixtapes found.");
		}
		let requests = mixtapes.map((mixtape) => {
			return new Promise(async (resolve) => {
				await songs.find({ _id: { $in: mixtape.songList } }).then(async (songs) => {
					mixtape['songList'] = songs ? songs : [];
					await comments.find({ _id: { $in: mixtape.comments } }).then((comments) => {
						mixtape['comments'] = comments ? comments : [];
						resolve(mixtape);
					}).catch((error) => {
						console.log(error)
						resolve(res.status(500).send("There was an error finding the comments."))
					});
				}).catch((error) => {
					console.log(error);
					resolve(res.status(500).send("There is a problem with finding the songs."))
				});
				resolve(mixtapes);
			});
		});
		Promise.all(requests).then((result) => {
			//console.log(result);
			return res.status(200).send(result);
		}).catch((error)=>{
			console.log(error);
			return res.status(500).send("Promise error, good luck.")
		})
	}).catch((error) => {
		console.log(error);
		return res.status(500).send("There is a problem with finding the mixtape.");
	});
})

// Gets a list of mixtapes from the database based their view count
router.get('/likes', async (req, res) => {
	await mixtapes.find({public : true}).sort({ views: -1 }).limit(20).then((mixtapes) => {
		//console.log(mixtapes);
		if (!mixtapes) {
			return res.status(404).send("No mixtapes found.");
		}
		let requests = mixtapes.map((mixtape) => {
			return new Promise(async (resolve) => {
				await songs.find({ _id: { $in: mixtape.songList } }).then(async (songs) => {
					mixtape['songList'] = songs ? songs : [];
					await comments.find({ _id: { $in: mixtape.comments } }).then((comments) => {
						mixtape['comments'] = comments ? comments : [];
						resolve(mixtape);
					}).catch((error) => {
						console.log(error)
						resolve(res.status(500).send("There was an error finding the comments."))
					});
				}).catch((error) => {
					console.log(error);
					resolve(res.status(500).send("There is a problem with finding the songs."))
				});
				resolve(mixtapes);
			});
		});
		Promise.all(requests).then((result) => {
			//console.log(result);
			return res.status(200).send(result);
		}).catch((error)=>{
			console.log(error);
			return res.status(500).send("Promise error, good luck.")
		})
	}).catch((error) => {
		console.log(error);
		return res.status(500).send("There is a problem with finding the mixtape.");
	});
})

// Gets a list of mixtapes from the database based the search query, extremely simple implementation
router.get('/search/:query', async (req, res) => {
	await mixtapes.find({ name: {$regex: req.params.query, $options: "i"} }).sort({ views: -1 }).limit(20).then((mixtapes) => {
		//console.log(mixtapes);
		if (!mixtapes) {
			return res.status(404).send("No mixtapes found.");
		}
		let requests = mixtapes.map((mixtape) => {
			return new Promise(async (resolve) => {
				await songs.find({ _id: { $in: mixtape.songList } }).then(async (songs) => {
					await comments.find({ _id: { $in: mixtape.comments } }).then((comment) => {
						mixtape['songList'] = songs;
						mixtape['comments'] = comment;
						resolve(mixtape);
					}).catch((error) => {
						console.log(error)
						resolve(res.status(500).send("There was an error finding the comments."))
					});
				}).catch((error) => {
					console.log(error);
					resolve(res.status(500).send("There is a problem with finding the songs."))
				});
				resolve(mixtapes);
			});
		});
		Promise.all(requests).then((result) => {
			//console.log(result);
			return res.status(200).send(result);
		}).catch((error)=>{
			console.log(error);
			return res.status(500).send("Promise error, good luck.")
		})
	}).catch((error) => {
		console.log(error);
		return res.status(500).send("There is a problem with finding the mixtape.");
	});
})

// Gets songs in that mixtape
// Depreciated by Jason
router.get('/viewMixtape/id/:id', async (req, res) => {
	await mixtapes.findById(req.params.id).then(async (mixtape) => {
		if (!mixtape) {
			return res.status(404).send("No mixtapes found.");
		}
		let returnJSON = JSON.parse(JSON.stringify(mixtape))
		await songs.find({ _id: { $in: mixtape.songList } }).then(async (songs) => {
			await comments.find({ _id: { $in: mixtape.comments } }).then((comment) => {
				returnJSON['songList'] = songs;
				returnJSON['comments'] = comment;
				res.status(200).send(returnJSON);
			}).catch((error) => {
				console.log(error)
				res.status(500).send("There was an error finding the comments.")
			});
		}).catch((error) => {
			console.log(error);
			return res.status(500).send("There is a problem with finding the songs.")
		})
	}).catch((error) => {
		console.log(error);
		return res.status(500).send("There is a problem with finding the mixtape.");
	});
});

// Creates a mixtape in the database
router.post('/createMixtape/uid/:uid', /*verifyToken,*/ async (req, res) => {
	await mixtapes.create({
		owner: req.params.uid
	}).then(async (result) => {
		if (!result) {
			return res.status(404).send("There is a problem with creating the mixtape.");
		}
		return res.status(200).send(result);
	}).catch((error) => {
		console.log(error);
		return res.status(500).send("There is a problem with the database.");
	});
});

// Creates a mixtape in the database
router.post('/updateMixtape/id/:id', /*verifyToken,*/ async (req, res) => {
	await mixtapes.findByIdAndUpdate(req.params.id, {
		name: req.body.name,
		description: req.body.description,
		public: req.body.public,
		views: req.body.views,
		songList: req.body.songList,
		hearts: req.body.hearts,
		comments: req.body.comments,
		match: req.body.match
	}, {new: true}).then(async (result) => {
		if (!result) {
			return res.status(404).send("There is a problem with creating the mixtape.");
		}
		return res.status(200).send(result);
	}).catch((error) => {
		console.log(error);
		return res.status(500).send("There is a problem with the database.");
	});
});

// Deletes a mixtape in the database
router.post('/deleteMixtape/id/:id', verifyToken, async (req, res) => {
	await mixtapes.findByIdAndDelete(req.params.id).then(async (result) => {
		if (!result) {
			return res.status(404).send("There is a problem with removing the mixtape.");
		}
		return res.status(200).send(result);
	}).catch((error) => {
		console.log(error);
		return res.status(500).send("There is a problem with the database.");
	});
});

// Creates a comment for a specified mixtape in the database
// Updates the mixtapeJSON.comments
router.post('/createComment', verifyToken, async (req, res) => {
	await comments.create({
		owner: req.body.id,
		mixtape: req.body.mixtape,
		text: req.body.text
	}).then(async (result) => {
		if (!result) {
			return res.status(404).send("There is a problem with creating the comment.");
		}
		return res.status(200).send(result);
	}).catch((error) => {
		console.log(error);
		return res.status(500).send("There is a problem with the database.");
	});
});

module.exports = router;