require('dotenv').config()
const express = require("express");
const passport = require('passport');
const mongoose = require("mongoose");
const path = require("path");

const indexRouter = require("./routes/index");

const SERVER_PORT = process.env.SERVER_PORT;
const MONGO_URI = `mongodb+srv://${process.env.USER_NAME}:${process.env.PASSWORD}@cluster0.vq24q.mongodb.net/${process.env.DBNAME}?retryWrites=true&w=majority`
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));

app.use(passport.initialize());
app.use(passport.session());

app.use("/", indexRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
	next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
	// set locals, only providing error in development
	res.locals.message = err.message;
	res.locals.error = req.app.get("env") === "development" ? err : {};

	// render the error page
	res.status(err.status || 500);
	res.render("error");
});

module.exports = app;

mongoose.connect(MONGO_URI, {
	useNewUrlParser: true,
	useCreateIndex: true,
	useUnifiedTopology: true,
}).then(() => {
	console.log("Connected to the MongoDB database");
});

app.listen({ port: SERVER_PORT }, () => {
	console.log(`Server running at port: ${SERVER_PORT}`);
	console.log(`mongodb uri on: ${MONGO_URI}`);
});
