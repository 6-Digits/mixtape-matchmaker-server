// load .env variables
require('dotenv').config()
// create express app
const express = require('express');
const app = require('express')();
const cors = require('cors');
const test = require('./asyncTest')
app.use(cors());

app.use(express.static(__dirname));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// create expression session
const expressSession = require('express-session')({
	secret: 'secret',
	resave: false,
	saveUninitialized: false
});
app.use(expressSession);

// Chat
const chat = require('./chatServer');

// start server on port 42049
const port = 42069;
app.listen(port, () => {
	console.log(`Server running at port: ${port}`);
	console.log(`MongoDB URI on: ${mongoUri}`);
});
// create home page route
app.use("/", require("./routes/index"));

// create authentication routes
const authController = require('./authentication/authController');
app.use('/api/auth', authController);
const accountManagement = require('./routes/accountManagement');
app.use('/api/account', accountManagement);
const profileManagement = require('./routes/profileManagement');
app.use('/api/profile', profileManagement);
const mixtapeManagement = require('./routes/mixtapeManagement');
app.use('/api/mixtape', mixtapeManagement);
const matchManagement = require('./routes/matchManagement');
app.use('/api/match', matchManagement);
const search = require('./routes/search');
app.use('/api/search', search);
const youtube = require('./routes/youtube');
app.use('/api/youtube', youtube);

// initialize MongoDB
const mongoose = require('mongoose');
const mongoUri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.vq24q.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`
mongoose.connect(mongoUri, {
	useNewUrlParser: true,
	useUnifiedTopology: true,
}).then(() => {
	console.log("Connected to the MongoDB database");
});

module.exports = app;