require('dotenv').config();
const server = require("http").createServer();
const io = require("socket.io")(server);
const notifications = require('./models/notification')
const PORT = process.env.NOTIFICATION_PORT;
const NEW_NOTIFICATION_EVENT = "newNotificationEvent";

io.on("connection", (socket) => {
	console.log(`Client ${socket.id} connected`);

	// Join a conversation
	const { roomId } = socket.handshake.query;
	socket.join(roomId);

	// Listen for new messages
	socket.on(NEW_NOTIFICATION_EVENT, async (data) => {
		// This is where the server emits back the message
		io.in(roomId).emit(NEW_NOTIFICATION_EVENT, data);
		console.log(data)
		let notifications = {
			user: data.reciever,
			text: data.message
		}
		console.log(notifications)
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