require('dotenv').config();
const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const axios = require('axios');
const youtube = require('scrape-youtube').default;

const songs = require('../models/song');

router.use(bodyParser.urlencoded({ extended: true }));

function convertTime(duration) {
	let array = duration.match(/\d+/g);

	if (duration.indexOf('M') >= 0 && duration.indexOf('H') == -1 && duration.indexOf('S') == -1) {
		array = [0, array[0], 0];
	}
	if (duration.indexOf('H') >= 0 && duration.indexOf('M') == -1) {
		array = [array[0], 0, array[1]];
	}
	if (duration.indexOf('H') >= 0 && duration.indexOf('M') == -1 && duration.indexOf('S') == -1) {
		array = [array[0], 0, 0];
	}
	
	let seconds = 0;
	if (array.length === 3) {
		seconds += parseInt(array[0]) * 3600;
		seconds += parseInt(array[1]) * 60;
		seconds += parseInt(array[2]);
	}
	if (array.length === 2) {
		seconds += parseInt(array[0]) * 60;
		seconds += parseInt(array[1]);
	}
	if (array.length === 1) {
		seconds += parseInt(array[0]);
	}
	return seconds;
}

// uses 1 youtube api quota point per call
router.get('/video/:id', async (req, res) => {
	const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${req.params.id}&key=${process.env.YOUTUBE_API_KEY}`;
	
	axios.get(url).then((response) => {
		if (response.status === 200) {
			let data = response.data['items'][0];
			
			let song = {
				videoId: data['id'],
				title: data['snippet']['title'],
				url: `https://www.youtube.com/embed/${req.params.id}`,
				author: data['snippet']['channelTitle'],
				imgUrl: data['snippet']['thumbnails']['high']['url'],
				language: data['snippet']['defaultLanguage'] ? data['snippet']['defaultLanguage'] : 'en',
				genre: data['snippet']['tags'],
				duration: convertTime(data['contentDetails']['duration']),
				apiType: "YouTube"
			};
			
			return res.status(200).send(song);
		}
		else {
			return res.status(404).send("Invalid YouTube ID");
		}
	}).catch((error) => {
		console.log(error.message);
		return res.status(500).send(error.message);
	});
});

// does not use any youtube api quota points
router.get('/search/:query', async (req, res) => {
	youtube.search(req.params.query, { type: 'video' }).then(results => {
		let songs = results.videos.map(video => (
			{
				videoId: video['id'],
				title: video['title'],
				url: video['link'],
				author: video['channel']['name'],
				duration: video['duration'],
				imgUrl: video['thumbnail'],
				apiType: "YouTube"
			})
		);
		let json = { results: songs, total: songs.length };
		return res.status(200).send(json);
	}).catch((error) => {
		console.log(error.message);
		return res.status(500).send(error.message);
	});
});

// Creates song if not in database
// Return song collection
// http://localhost:42069/api/youtube/createSong/:videoId
router.post('/createSong/:videoId', async (req, res) => {
	await songs.findOne({ videoId: req.params.videoId }).then(async (result) => {
		if (result) {
			// song already in database, return it
			return res.status(200).send(result);
		} 
		else {
			// song not in database, query youtube
			const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${req.params.videoId}&key=${process.env.YOUTUBE_API_KEY}`;
			let response = await axios.get(url).catch((error => {
				console.log(error.message);
				return res.status(500).send(error.message);
			}));
			if (response.status === 200) {
				// proper youtube id entered
				let data = response.data['items'][0];
				
				// format song object
				let song = {
					videoId: data['id'],
					title: data['snippet']['title'],
					url: `https://www.youtube.com/embed/${req.params.id}`,
					author: data['snippet']['channelTitle'],
					imgUrl: data['snippet']['thumbnails']['high']['url'],
					language: data['snippet']['defaultLanguage'] ? data['snippet']['defaultLanguage'] : 'en',
					genre: data['snippet']['tags'],
					duration: convertTime(data['contentDetails']['duration']),
					apiType: "YouTube"
				};
				
				// add song to database
				await songs.create(song).then((result) => {
					return res.status(200).send(result);
				}).catch((error) => {
					console.log(error);
					return res.status(500).send("Error in creating song.")
				});
			}
			else {
				// invalid youtube id
				return res.status(404).send("Invalid YouTube ID");
			}
		}
	}).catch((error) => {
		console.log(error);
		return res.status(500).send("Error in finding song.");
	})
});

module.exports = router;