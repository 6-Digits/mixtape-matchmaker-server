require('dotenv').config();
const axios = require('axios');
const profiles = require('./models/profile');
const preferences = require('./models/preference');
const matches = require('./models/match');

const tf = require('@tensorflow/tfjs');
require('@tensorflow/tfjs-node'); // CPU computation
const use = require('@tensorflow-models/universal-sentence-encoder');

const delay = 120000;

async function createMatches() {
	try {
		let request = await axios.get(`${process.env.SERVER_API}/match/mixtapes`);
		let playlists = request.data;
		let users = playlists.map(playlist => {
			const genres = playlist['songList'].map(x => x['genre']);
			const user = {
				id: playlist['owner'],
				genres: genres
			}
			return user;
		});
		
		let userEmbeddings = []
		await use.load().then(async (model) => {
			for (const user of users) {				
				let scores = [];
				const genres = user['genres'];
				const uid = user['id']
				
				if (genres.length === 0) {
					continue;
				}
				
				for (const genre of genres) {
					if (genre.length > 0) {
						const embeddings = await model.embed(genre);
						const score = tf.mean(embeddings, 0);
						scores.push(score);
					}
				}
				
				if (scores.length === 0) {
					continue;
				}
				
				scores = tf.stack(scores);
				const embedding = tf.mean(scores, 0);
				
				const profile = await profiles.findById(uid);
				const preference = await preferences.findById(uid);
				
				userEmbedding = {
					_id: uid,
					gender: profile['gender'],
					profileLikes: profile['profileLikes'],
					profileDislikes: profile['profileDislikes'],
					age: new Date().getFullYear() - profile['dob'].getFullYear(),
					genderPref: preference['gender'],
					ageUpper: preference['ageUpper'],
					ageLower: preference['ageLower'],
					geocode: preference['geocode'],
					embedding: embedding
				};
				
				userEmbeddings.push(userEmbedding);
			}
		});
		
		let matchLists = await matches.find();
		for (const match of matchLists) {
			if (match['matches'].length === 0) {
				const current = userEmbeddings.find(e => e['_id'] == match['_id']);
				let scores = [];
				for (const user of userEmbeddings) {
					if (user['_id'] == current['_id'] || user['_id'] in current['profileLikes'] || 
						(user['gender'] != current['genderPref'] && current['genderPref'] != "No Preference") || 
						user['age'] < current['ageLower'] || user['age'] > current['ageUpper']) {
						continue;
					}
					if (user['_id'] in current['profileDislikes']) {
						const time = current['profileDislikes'][user['_id']];
						if (Date.now() - time > 3600000 * 7) {
							continue;
						}
					}
					
					let mixtapeScore = tf.metrics.cosineProximity(user['embedding'], current['embedding']).arraySync();
					let locationScore = tf.metrics.meanAbsoluteError(tf.tensor(user['geocode']), tf.tensor(current['geocode'])).arraySync();
					if (locationScore < 0.0001) {
						locationScore = 0.0001;
					}
					
					const score = {
						_id: user['_id'],
						score: mixtapeScore / locationScore
					};
					scores.push(score);
				}
				
				if (scores.length > 0) {
					scores.sort((a, b) => b['score'] - a['score']);
					const matchList = scores.slice(0, 10).map(x => x['_id']);
					await matches.findByIdAndUpdate(current['_id'], { matches: matchList });
				}
			}
		}
	}
	catch (exception) {
		console.log('something broke in creating matches');
		console.log(exception);
	}
}

setTimeout(async function timer() {
	await createMatches();
	setTimeout(timer, delay);
}, delay);
