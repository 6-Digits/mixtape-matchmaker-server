require('dotenv').config();
const axios = require('axios');

const profiles = require('../models/profile');
const preferences = require('../models/preference');
const matches = require('../models/match');

const DELAY = 5 * 60000;

function euclideanDistance(x, y) {
	if (x.length !== 2 && y.length !== 2) {
		return 0;
	}
	
	const d1 = x[0] - y[0];
	const d2 = x[1] - y[1];
	return Math.sqrt(d1 * d1 + d2 * d2);
}

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
		for (const user of users) {
			const genres = user['genres'];
			const uid = user['id']
			
			if (genres.length === 0) {
				continue;
			}
			
			const embedding = [genres.length];
			
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
		
		let matchLists = await matches.find();
		for (const match of matchLists) {
			if (match['matches'].length === 0) {
				const current = await userEmbeddings.find(e => e['_id'] == match['_id']);
				if (current == undefined || current == null) {
					continue;
				}
				if (current['genderPref'] == undefined || current['genderPref'] == null || current['genderPref'] == "") {
					continue;
				}
				
				let scores = [];
				for (const user of userEmbeddings) {
					if (user['_id'] == current['_id'] || current['profileLikes'].has(user['_id']) || 
						(user['gender'] != current['genderPref'] && current['genderPref'] != "No Preference") || 
						user['age'] < current['ageLower'] || user['age'] > current['ageUpper']) {
							continue;
					}
					
					if (current['profileDislikes'].has(user['_id'])) {
						const time = current['profileDislikes'].get(user['_id']);
						if (Date.now() - time < 3600000 * 7) {
							continue;
						}
					}
					
					let mixtapeScore = Math.abs(user['embedding'] - current['embedding']);
					let locationScore = euclideanDistance(user['geocode'], current['geocode']);
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
	catch (error) {
		console.log('something broke in creating matches');
		console.log(error);
	}
}

setTimeout(async function timer() {
	await createMatches();
	console.log("Matches created")
	setTimeout(timer, DELAY);
}, DELAY);
