const express = require('express');
const router = express.Router();
const accounts = require('../models/account');

router.get('/', function(req, res, next) {
	res.send("Server is working properly");
});

// router.get('/account', async (req, res) => {
// 	const posts = await accounts.find({});
// 	res.send(posts);
// });

module.exports = router;
