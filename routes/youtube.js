require('dotenv').config();
const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const axios = require('axios');

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
	
	axios.get(url)
		.then((response) => {
			if (response.status == 200) {
				let data = response.data['items'][0];
				
				let song = {
					id: data['id'],
					title: data['snippet']['title'],
					url: `https://www.youtube.com/watch?v=${req.params.id}`,
					author: data['snippet']['channelTitle'],
					thumbnail: data['snippet']['thumbnails']['standard']['url'],
					language: data['snippet']['defaultLanguage'] ? data['snippet']['defaultLanguage'] : 'en',
					genres: data['snippet']['tags'],
					duration: convertTime(data['contentDetails']['duration'])
				};
				
				return res.status(200).send(song);
			}
			else {
				res.status(404).send("Invalid YouTube ID");
			}
		})
		.catch((error) => {
			console.log(error.message);
			return res.status(500).send(error.message);
		});
})

// does not use any youtube api quota points
router.get('/search/:query', async (req, res) => {
	const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(req.params.query)}`;
	
	axios.get(url)
		.then((response) => {
			if (response.status == 200) {
				try {
					let match = response.data.match(/ytInitialData[^{]*(.*);\s*\/\/ scraper_data_end/s);
					let data = JSON.parse(match[1]);
					let results = data.contents.twoColumnSearchResultsRenderer.primaryContents.sectionListRenderer.contents;
					
					let json = { results: [] }
					results.filter(x => x.hasOwnProperty("itemSectionRenderer")).forEach(result => {
						result.itemSectionRenderer.contents.forEach(content => {
							if (content.hasOwnProperty("videoRenderer")) {
								let render = content.videoRenderer;
								let song = {
									id: render.videoId,
									title: render.title.runs.reduce((a, b) => a + b.text, ""),
									url: `https://www.youtube.com${render.navigationEndpoint.commandMetadata.webCommandMetadata.url}`,
									author: render.ownerText.runs[0].text,
									duration: render.lengthText ? render.lengthText.simpleText : "Live",
									thumbnail: render.thumbnail.thumbnails[render.thumbnail.thumbnails.length - 1].url,
								};
								json['results'].push(song);
							}
						});
					});
					json['total'] = json['results'].length;
					
					return res.status(200).send(json);
				}
				catch (error) {
					console.log(error.message);
					res.status(500).send(error.message);
				}
			}
			else {
				res.status(404).send("Invalid query");
			}
		})
		.catch((error) => {
			console.log(error.message);
			return res.status(500).send(error.message);
		});
})

module.exports = router;