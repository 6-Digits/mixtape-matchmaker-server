require('dotenv').config();
const server = require("http").createServer();
const io = require("socket.io")(server);
const notifications = require('./models/notification')
const accounts = require('./models/account')
const PORT = process.env.NOTIFICATION_PORT;
const NEW_NOTIFICATION_EVENT = "newNotificationEvent";

io.on("connection", (socket) => {
	console.log(`Client ${socket.id} connected`);

	// Join a conversation
	const { roomId } = socket.handshake.query;
	socket.join(roomId);

	// Listen for new messages
	socket.on(NEW_NOTIFICATION_EVENT, async (data) => {
		//console.log(roomId)
		//console.log(data)
		let notification = {
			user: data.reciever,
			message: data.message,
			time: Date.now(),
		}
		await accounts.findById(date.reciever).then((accountDB)=>{
			if (accountDB.allowNotifications){
				// This is where the server emits back the message to a reciever
				io.in(data.reciever).emit(NEW_NOTIFICATION_EVENT, notification);
				notifications.create(notification).then((result)=>{
					console.log("Success in creating a notification in DB")
				}).catch((error)=>{
					console.log("Error in creating a notification in DB")
				})
			}
		}).catch((error)=>{
			console.log("Error finding the account")
			console.log(error)
		})
		//console.log(notification)
	});

	// Leave the room if the user closes the socket
	socket.on("disconnect", () => {
		console.log(`Client ${socket.id} disconnected`);
		socket.leave(roomId);
	});
});

server.listen(PORT, () => {
	console.log(`Notification server on port ${PORT}`);
});