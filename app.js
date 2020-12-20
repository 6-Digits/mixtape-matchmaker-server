require('dotenv').config()
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express()
	.use(cors())
	.use(express.static(__dirname))
	.use(express.json())
	.use(express.urlencoded({ extended: true }));

// background scripts
require('./scripts/chatServer');
require('./scripts/notificationServer');
require('./scripts/createLinks');
require('./scripts/createMatches');

// routes
app.use("/", require("./routes/index"));
app.use('/account', require('./routes/accountManagement'));
app.use('/profile', require('./routes/profileManagement'));
app.use('/mixtape', require('./routes/mixtapeManagement'));
app.use('/match', require('./routes/matchManagement'));
app.use('/search', require('./routes/search'));
app.use('/youtube', require('./routes/youtube'));

// initialize MongoDB
const mongoUri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.vq24q.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`
mongoose.connect(mongoUri, {
	useNewUrlParser: true,
	useUnifiedTopology: true,
}).then(() => {
	console.log("Connected to the MongoDB database");
});

// start server on port 42049
const port = process.env.PORT;
app.listen(port, () => {
	console.log(`Server running at port: ${port}`);
});

module.exports = app;