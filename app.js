// load .env variables
require('dotenv').config()

// create express app
const express = require('express');
const app = express();

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

// start server on port 42049
const port = process.env.PORT || 42069;
app.listen(port, () => {
	console.log(`Server running at port: ${port}`);
	console.log(`MongoDB URI on: ${mongoUri}`);
});

// create home page route
app.use("/", require("./routes/index"));

// initialize passport
const passport = require('passport');
app.use(passport.initialize());
app.use(passport.session());

// initialize MongoDB
const mongoose = require('mongoose');
const mongoUri = `mongodb+srv://${process.env.USER_NAME}:${process.env.PASSWORD}@cluster0.vq24q.mongodb.net/${process.env.DBNAME}?retryWrites=true&w=majority`
mongoose.connect(mongoUri, {
	useNewUrlParser: true,
	useUnifiedTopology: true,
}).then(() => {
	console.log("Connected to the MongoDB database");
});

// create user login schema (TODO: change this)
const Schema = mongoose.Schema;
const UserDetail = new Schema({
	username: String,
	passport: String
});

// passport automagical stuff
const passportLocalMongoose = require('passport-local-mongoose');
UserDetail.plugin(passportLocalMongoose);
const UserDetails = mongoose.model('userInfo', UserDetail, 'userInfo');
passport.use(UserDetails.createStrategy());
passport.serializeUser(UserDetails.serializeUser());
passport.deserializeUser(UserDetails.deserializeUser());


// need views and routes

module.exports = app;
