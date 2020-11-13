require('dotenv').config();
const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const http = require('http');
const https = require('https');

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
	
	seconds = 0;
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
	return seconds
}


router.get('/video/:id', async (req, res) => {
	const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${req.params.id}&key=${process.env.YOUTUBE_API_KEY}`;
	
	https.get(url, (response) => {
		let body = "";
		
		response.on('data', (data) => {
			body += data;
		});
		response.on('end', () => {
			try {
				let json = JSON.parse(body);
				let songData = json['items'][0];
				
				let song = {
					id: songData['id'],
					title: songData['snippet']['title'],
					author: songData['snippet']['channelTitle'],
					thumbnail: songData['snippet']['thumbnails']['maxres']['url'],
					language: songData['snippet']['defaultLanguage'] ? songData['snippet']['defaultLanguage'] : 'en',
					genres: songData['snippet']['tags'],
					duration: convertTime(songData['contentDetails']['duration'])
				};
				
				return res.status(200).send(song);
			}
			catch (error) {
				console.log(error.message);
				return res.status(500).send(error.message);
			}
		});
	}).on('error', (err) => {
		console.log(err);
		return res.status(500).send(err.message);
	});
})

module.exports = router;