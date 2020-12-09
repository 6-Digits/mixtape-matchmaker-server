require('dotenv').config();
const axios = require('axios');
const profiles = require('./models/profile');
const matches = require('./models/match');

const delay = 60000;

async function createMatches() {
	
}

setTimeout(async function timer() {
	await createMatches();
	setTimeout(timer, delay);
}, delay);
