require('dotenv').config();
const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const axios = require('axios');
const accounts = require('../models/account');
const mixtapes = require('../models/mixtape');
const songs = require('../models/song');
const comments = require('../models/comment');
const profiles = require('../models/profile.js');
const verifyToken = require('../authentication/verifyToken');
const Promise = require('bluebird');

router.use(bodyParser.urlencoded({ extended: true }));

// Gets a single mixtape from the database based on their unique mixtape id
// http://localhost:42069/api/mixtape/id/:id
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
// http://localhost:42069/api/mixtape/uid/:id
router.get('/uid/:id', async (req, res) => {
	await mixtapes.find({ owner: req.params.id }).then(async (mixtapes) => {
		if (!mixtapes) {
			return res.status(404).send("No mixtapes found.");
		}
		mixtapes = mixtapes.filter(mixtape => !mixtape.match);
		let requests = mixtapes.map((mixtape) => {
			return new Promise(async (resolve) => {
				let songList = mixtape.songList;
				mixtape['songList'] = [];
				let songPromise = Promise.each(songList, async (songID) => {
					await songs.findById(songID).then((songDB) => {
						mixtape['songList'].push(songDB)
					}).catch((error) => {
						console.log(error);
						return res.status(500).send("DB error")
					})
				})
				let commentList = mixtape.comments;
				mixtape['comments'] = [];
				let commentPromise = Promise.each(commentList, async (commentID) => {
					await comments.findById(commentID).then(async (commentDB) => {
						let user = await profiles.findById(commentDB['user']);
						let comment = {
							_id: commentDB['_id'],
							text: commentDB['text'],
							date: commentDB['date'],
							user: commentDB['user'],
							name: user['userName'],
							picture: user['imgSrc'],
						};
						mixtape['comments'].push(comment);
					}).catch((error) => {
						console.log(error);
						return res.status(500).send("DB error")
					})
				})
				Promise.all([songPromise, commentPromise]).then(() => {
					resolve();
				})
			})
		})
		Promise.all(requests).then(() => {
			return res.status(200).send(mixtapes);
		}).catch((error) => {
			console.log(error);
			return res.status(500).send("Promise error, good luck.")
		})
	}).catch((error) => {
		console.log(error);
		return res.status(500).send("There is a problem with finding the mixtape.");
	});
})

// Gets a list of mixtapes from the database based their view count
// http://localhost:42069/api/mixtape/popular
router.get('/popular', async (req, res) => {
	await mixtapes.find({ public: true }).sort({ views: -1 }).limit(20).then((mixtapes) => {
		if (!mixtapes) {
			return res.status(404).send("No mixtapes found.");
		}
		mixtapes = mixtapes.filter(mixtape => !mixtape.match && mixtape.public);
		let requests = mixtapes.map((mixtape) => {
			return new Promise(async (resolve) => {
				let songList = mixtape.songList;
				mixtape['songList'] = [];
				let songPromise = Promise.each(songList, async (songID) => {
					await songs.findById(songID).then((songDB) => {
						mixtape['songList'].push(songDB)
					}).catch((error) => {
						console.log(error);
						return res.status(500).send("DB error")
					})
				});
				
				let commentList = mixtape.comments;
				mixtape['comments'] = [];
				let commentPromise = Promise.each(commentList, async (commentID) => {
					await comments.findById(commentID).then( async (commentDB) => {
						let user = await profiles.findById(commentDB['user']);
						let comment = {
							_id: commentDB['_id'],
							text: commentDB['text'],
							date: commentDB['date'],
							user: commentDB['user'],
							name: user['userName'],
							picture: user['imgSrc'],
						}
						mixtape['comments'].push(comment);
					}).catch((error) => {
						console.log(error);
						return res.status(500).send("DB error")
					});
				});
				
				Promise.all([songPromise, commentPromise]).then(() => {
					resolve();
				});
				
			})
		})
		Promise.all(requests).then(() => {
			return res.status(200).send(mixtapes);
		}).catch((error) => {
			console.log(error);
			return res.status(500).send("Promise error, good luck.")
		})
	}).catch((error) => {
		console.log(error);
		return res.status(500).send("There is a problem with finding the mixtape.");
	});
})

// Gets a list of mixtapes from the database that the user liked
// http://localhost:42069/api/mixtape/liked/uid/:uid
router.get('/liked/uid/:uid', async (req, res) => {
	await profiles.findById(req.params.uid).then((result) => {
		let likedMixtapeIDs = Array.from(result.mixtapeHearts.keys());
		let requests = likedMixtapeIDs.map((mixtapeID) => {
			return new Promise(async (resolve) => {
				await mixtapes.findById(mixtapeID).then((mixtape) => {
					resolve(mixtape);
				}).catch((error) => {
					console.log(error);
					resolve(res.status(500).send("There is a problem with getting the mixtapes."))
				})
			})
		})
		Promise.all(requests).then((mixtapeList) => {
			mixtapeList = mixtapeList.filter(mixtape => mixtape);
			let requests = mixtapeList.map((mixtape) => {
				return new Promise(async (resolve) => {
					let songList = mixtape.songList;
					mixtape['songList'] = [];
					let songPromise = Promise.each(songList, async (songID) => {
						await songs.findById(songID).then((songDB) => {
							mixtape['songList'].push(songDB)
						}).catch((error) => {
							console.log(error);
							return res.status(500).send("DB error")
						})
					})
					let commentList = mixtape.comments;
					mixtape['comments'] = [];
					let commentPromise = Promise.each(commentList, async (commentID) => {
						await comments.findById(commentID).then( async (commentDB) => {
							let user = await profiles.findById(commentDB['user']);
							let comment = {
								_id: commentDB['_id'],
								text: commentDB['text'],
								date: commentDB['date'],
								user: commentDB['user'],
								name: user['userName'],
								picture: user['imgSrc'],
							}
							mixtape['comments'].push(comment);
						}).catch((error) => {
							console.log(error);
							return res.status(500).send("DB error")
						})
					})
					Promise.all([songPromise, commentPromise]).then(() => {
						resolve();
					})
				})
			})
			Promise.all(requests).then(() => {
				return res.status(200).send(mixtapeList);
			}).catch((error) => {
				console.log(error);
				return res.status(500).send("Promise error, good luck.")
			})
		}).catch((error) => {
			console.log(error)
			return res.status(500).send("Major error in Promise")
		});
	}).catch((error) => {
		console.log(error);
		return res.status(500).send("Error in profile DB.")
	});
})

// Gets a list of mixtapes from the database based the search query, extremely simple implementation
// http://localhost:42069/api/mixtape/search/:query
router.get('/search/:query', async (req, res) => {
	await mixtapes.find({ name: { $regex: req.params.query, $options: "i" } }).sort({ views: -1 }).limit(20).then((mixtapes) => {
		if (!mixtapes) {
			return res.status(404).send("No mixtapes found.");
		}
		mixtapes = mixtapes.filter(mixtape => !mixtape.match && mixtape.public);
		let requests = mixtapes.map((mixtape) => {
			return new Promise(async (resolve) => {
				let songList = mixtape.songList;
				mixtape['songList'] = [];
				let songPromise = Promise.each(songList, async (songID) => {
					await songs.findById(songID).then((songDB) => {
						mixtape['songList'].push(songDB)
					}).catch((error) => {
						console.log(error);
						return res.status(500).send("DB error")
					})
				})
				let commentList = mixtape.comments;
				mixtape['comments'] = [];
				let commentPromise = Promise.each(commentList, async (commentID) => {
					await comments.findById(commentID).then( async (commentDB) => {
						let user = await profiles.findById(commentDB['user']);
						let comment = {
							_id: commentDB['_id'],
							text: commentDB['text'],
							date: commentDB['date'],
							user: commentDB['user'],
							name: user['userName'],
							picture: user['imgSrc'],
						}
						mixtape['comments'].push(comment);
					}).catch((error) => {
						console.log(error);
						return res.status(500).send("DB error")
					})
				})
				Promise.all([songPromise, commentPromise]).then(() => {
					resolve();
				})
			})
		})
		Promise.all(requests).then(() => {
			return res.status(200).send(mixtapes);
		}).catch((error) => {
			console.log(error);
			return res.status(500).send("Promise error, good luck.")
		})
	}).catch((error) => {
		console.log(error);
		return res.status(500).send("There is a problem with finding the mixtape.");
	});
})

// Gets songs in that mixtape based on uid
router.get('/viewMixtape/id/:id', async (req, res) => {
	await mixtapes.findById(req.params.id).then(async (mixtape) => {
		if (!mixtape) {
			return res.status(404).send("No mixtapes found.");
		}
		// Disgusting
		let mixtapes = [mixtape]
		mixtapes = mixtapes.filter(mixtape => !mixtape.match && mixtape.public);
		let requests = mixtapes.map((mixtape) => {
			return new Promise(async (resolve) => {
				let songList = mixtape.songList;
				mixtape['songList'] = [];
				let songPromise = Promise.each(songList, async (songID) => {
					await songs.findById(songID).then((songDB) => {
						mixtape['songList'].push(songDB)
					}).catch((error) => {
						console.log(error);
						return res.status(500).send("DB error")
					})
				})
				let commentList = mixtape.comments;
				mixtape['comments'] = [];
				let commentPromise = Promise.each(commentList, async (commentID) => {
					await comments.findById(commentID).then( async (commentDB) => {
						let user = await profiles.findById(commentDB['user']);
						let comment = {
							_id: commentDB['_id'],
							text: commentDB['text'],
							date: commentDB['date'],
							user: commentDB['user'],
							name: user['userName'],
							picture: user['imgSrc'],
						}
						mixtape['comments'].push(comment);
					}).catch((error) => {
						console.log(error);
						return res.status(500).send("DB error")
					})
				})
				Promise.all([songPromise, commentPromise]).then(() => {
					resolve();
				})
			})
		})
		Promise.all(requests).then(() => {
			return res.status(200).send(mixtapes[0]);
		}).catch((error) => {
			console.log(error);
			return res.status(500).send("Promise error, good luck.")
		})
	}).catch((error) => {
		console.log(error);
		return res.status(500).send("There is a problem with finding the mixtape.");
	});
})

// Creates a mixtape in the database
// http://localhost:42069/api/mixtape/createMixtape/uid/:uid
router.post('/createMixtape/uid/:uid', /*verifyToken,*/ async (req, res) => {
	await mixtapes.create({
		owner: req.params.uid,
		name: "My Mixtape",
		views: 0,
		hearts: 0
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

// Updates a mixtape in the database
// http://localhost:42069/api/mixtape/updateMixtape/id/:id
router.post('/updateMixtape/id/:id', /*verifyToken,*/ async (req, res) => {
	await mixtapes.findByIdAndUpdate(req.params.id, {
		name: req.body.name,
		description: req.body.description,
		public: req.body.public,
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
});

// Assumes the req.body is in the same format as the song document in the DB.
// If the song is already in the DB based on the videoId, the post doesn't add the song.
// http://localhost:42069/api/mixtape/addSong
router.post('/addSong', async (req, res) => {
	await songs.findOne({ videoId: req.body.videoId }).then(async (result) => {
		if (result) {
			return res.status(200).send(result._id);
		} else {
			await songs.create(req.body).then((result) => {
				return res.status(200).send(result._id);
			}).catch((error) => {
				console.log(error);
				return res.status(500).send("Error in creating song.")
			})
		}
	}).catch((error) => {
		console.log(error);
		return res.status(500).send("Error in finding song.");
	})
})

// Creates song if not in database
// Return song collection
// http://localhost:42069/api/mixtape/createSong/:videoId
router.post('/createSong/:videoId', async (req, res) => {
	await songs.findOne({ videoId: req.params.videoId }).then(async (result) => {
		if (result) {
			return res.status(200).send(result);
		} else {
			let result = await axios.get(`${process.env.SERVER_API}/youtube/video/${req.params.videoId}`).catch((error => {
				console.log(error);
				return res.status(500).send("Error in YouTube query.");
			}));
			let song = result.data;
			
			await songs.create(song).then((result) => {
				return res.status(200).send(result);
			}).catch((error) => {
				console.log(error);
				return res.status(500).send("Error in creating song.")
			})
		}
	}).catch((error) => {
		console.log(error);
		return res.status(500).send("Error in finding song.");
	})
})

// Deletes a mixtape in the database
// http://localhost:42069/api/mixtape/deleteMixtape/id/:id
router.post('/deleteMixtape/id/:id', verifyToken, async (req, res) => {
	await mixtapes.findByIdAndDelete(req.params.id).then(async (deletedMixtape) => {
		if (!deletedMixtape) {
			return res.status(404).send("There is a problem with removing the mixtape.");
		}
		await comments.deleteMany({_id : {$in : deletedMixtape.comments}}).then((result)=>{
			return res.status(200).send(deletedMixtape);
		}).catch((error)=>{
			console.log(error)
			return res.status(500).send("Error in deleteing comments")
		})
	}).catch((error) => {
		console.log(error);
		return res.status(500).send("There is a problem with the database.");
	});
});

// Creates a comment for a specified mixtape in the database
// Assumes that you update the commentIDList in the frontend
// http://localhost:42069/api/mixtape/createComment/mid/:mid
router.post('/createComment/mid/:mid', /*verifyToken,*/ async (req, res) => {
	await comments.create({
		user: req.body.user,
		text: req.body.text,
		date: Date.now()
	}).then(async (result) => {
		if (!result) {
			return res.status(404).send("There is a problem with creating the comment.");
		}
		await mixtapes.findByIdAndUpdate(req.params.mid, { $push: { comments: { $each: [result._id], $position: 0}}}).catch((error)=>{
			console.log(error)
			return res.status(500).send("Error in updating the mixtape comment list.")
		})
		let user = await profiles.findById(req.body.user);
		let comment = {
			_id: result['_id'],
			text: result['text'],
			date: result['date'],
			user: result['user'],
			name: user['userName'],
			picture: user['imgSrc'],
		}
		return res.status(200).send(comment);
	}).catch((error) => {
		console.log(error);
		return res.status(500).send("There is a problem with the database.");
	});
});

// Get the comments for a particular mixtape based on it's mixtape id
router.get('/getComments/id/:id', verifyToken, async (req, res) => {
	await comments.find({ mixtape: req.params.id }).then(async (result) => {
		if (!result) {
			return res.status(404).send("There is a problem with getting the comments.");
		}
		return res.status(200).send(result);
	}).catch((error) => {
		console.log(error);
		return res.status(500).send("There is a problem with the database.");
	});
});

// Gets a list of mixtape IDs from the database that the user liked
// http://localhost:42069/api/mixtape/likedIDs/uid/:uid
router.get('/likedIDs/uid/:uid', async (req, res) => {
	await profiles.findById(req.params.uid).then((result) => {
		let likedMixtapes = result.mixtapeHearts.toJSON();
		return res.status(200).send(likedMixtapes);
	}).catch((error) => {
		console.log(error);
		return res.status(500).send("Error in profile DB.")
	});
})

// When a user hearts a mixtape, that mixtape's heart amount is incremented by 1 
// Furthermore, profile.mixtapeHearts is edited to reflect the like
// Assumes that the body contains mixtapeID and userID
// http://localhost:42069/api/mixtape/like
router.post('/like', /*verifyToken,*/ async (req, res) => {
	await profiles.findById(req.body.userID).then(async (profileDB) => {
		if (!profileDB) {
			return res.status(404).send("No result for profile.")
		}
		if (!profileDB.mixtapeHearts.has(req.body.mixtapeID)) {
			await mixtapes.findByIdAndUpdate(req.body.mixtapeID, { $inc: { hearts: 1 } }).then(async (result) => {
				if (!result) {
					return res.status(404).send("No result found for mixtape.")
				}
				// Disgusting
				let string = `mixtapeHearts.${req.body.mixtapeID}`;
				let param = {};
				param[string] = true;
				await profiles.findByIdAndUpdate(req.body.userID, { $set: param }).then((result) => {
					if (!result) {
						return res.status(404).send("No result found for profile.")
					}
					return res.status(200).send("Success.")
				}).catch((error) => {
					console.log(error);
					return res.status(500).send("Error in updating the profile.")
				})
			}).catch((error) => {
				console.log(error);
				return res.status(500).send("Error in updating the mixtape.")
			})
		}
		else {
			return res.status(200).send("Already liked the mixtape")
		}
	}).catch((error) => {
		console.log(error)
		return res.status(500).send("Error in profile DB.")
	})
})

// When a user hearts a mixtape, that mixtape's heart amount is incremented by 1 
// Furthermore, profile.mixtapeHearts is edited to reflect the like
// Assumes that the body contains mixtapeID and userID
// http://localhost:42069/api/mixtape/unlike
router.post('/unlike', /*verifyToken,*/ async (req, res) => {
	await profiles.findById(req.body.userID).then(async (profileDB) => {
		if (!profileDB) {
			return res.status(404).send("No result for profile.")
		}
		if (profileDB.mixtapeHearts.has(req.body.mixtapeID)) {
			await mixtapes.findByIdAndUpdate(req.body.mixtapeID, { $inc: { hearts: -1 } }).then(async (result) => {
				if (!result) {
					return res.status(404).send("No result found for mixtape.")
				}
				// Disgusting
				let string = `mixtapeHearts.${req.body.mixtapeID}`;
				let param = {};
				param[string] = true;
				await profiles.findByIdAndUpdate(req.body.userID, { $unset: param }).then((result) => {
					if (!result) {
						return res.status(404).send("No result found for profile.")
					}
					return res.status(200).send("Success.")
				}).catch((error) => {
					console.log(error);
					return res.status(500).send("Error in updating the profile.")
				})
			}).catch((error) => {
				console.log(error);
				return res.status(500).send("Error in updating the mixtape.")
			})
		}
		else {
			return res.status(200).send("Already unliked the mixtape.")
		}
	}).catch((error) => {
		console.log(error)
		return res.status(500).send("Error in profile DB.")
	})
})

// http://localhost:42069/api/mixtape/view
router.post('/view', async (req, res) => {
	await profiles.findById(req.body.userID).then(async (profileDB) => {
		if (!profileDB) {
			return res.status(404).send("No result for profile.")
		}
		// Disgusting
		let string = `mixtapeViews.${req.body.mixtapeID}`;
		let param = {};
		param[string] = Date.now();
		// There is no mixtapeID in the map OR
		// It's been an hour since they have viewed the mixtape
		if (!(profileDB.mixtapeViews.has(req.body.mixtapeID)) || Date.now() - profileDB.mixtapeViews.get(req.body.mixtapeID) > 3600000) {
			//console.log(mixtapeViews);
			await profiles.findByIdAndUpdate(req.body.userID, { $set: param }).then(async (result) => {
				await mixtapes.findByIdAndUpdate(req.body.mixtapeID, { $inc: { views: 1 } }).then(async (result) => {
					if (!result) {
						return res.status(404).send("No result found for mixtape.")
					}
					return res.status(200).send("Success!")
				}).catch((error) => {
					console.log(error);
					return res.status(500).send("Error in updating the mixtape.")
				})
			}).catch((error) => {
				console.log(error);
				return res.status(500).send("Error in profile database.")
			})
		} else {
			return res.status(200).send("Already seen the mixtape today.")
		}
	}).catch((error) => {
		console.log(error);
		return res.status(500).send("Error in finding profile.")
	})
})

module.exports = router;