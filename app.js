require('dotenv').config()
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
app.use(cors());
app.use(express.static(__dirname));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const server = require('http').createServer(app);
const io = require("socket.io").listen(server);

const createSockets = require('./scripts/createSockets');
const createChats = require('./scripts/createChats');
const createMatches = require('./scripts/createMatches');

// open sockets for chats and notifications
createSockets(io);

// background script for chat creating
const CHAT_DELAY = 2 * 60000;
setTimeout(async function timer() {
	await createChats(io);
	console.log("Chats created")
	setTimeout(timer, CHAT_DELAY);
}, CHAT_DELAY);

// background script for matching algorithm
const MATCH_DELAY = 5 * 60000;
setTimeout(async function timer() {
	await createMatches(io);
	console.log("Matches created")
	setTimeout(timer, MATCH_DELAY);
}, MATCH_DELAY);

// routes
app.use("/", require("./routes/index"));
app.use('/account', require('./routes/accountManagement'));
app.use('/profile', require('./routes/profileManagement'));
app.use('/mixtape', require('./routes/mixtapeManagement'));
app.use('/match', require('./routes/matchManagement'));
app.use('/search', require('./routes/search'));
app.use('/youtube', require('./routes/youtube'));

// initialize MongoDB
const db_username = process.env.DB_USERNAME;
const db_password = process.env.DB_PASSWORD;
const db_cluster = process.env.DB_CLUSTER;
const db_name = process.env.DB_NAME;
const mongoUri = `mongodb+srv://${db_username}:${db_password}@${db_cluster}/${db_name}?retryWrites=true&w=majority`
mongoose.connect(mongoUri, {
	useNewUrlParser: true,
	useUnifiedTopology: true,
}).then(() => {
	console.log("Connected to the MongoDB database");
});

const port = process.env.PORT
server.listen(port, () => {
	console.log(`Server started on port ${port}`);
});

module.exports = app;