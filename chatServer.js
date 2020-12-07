require('dotenv').config();
const server = require("http").createServer();
const io = require("socket.io")(server);
const messages = require('./models/message');
const chats = require('./models/chat');
const PORT = process.env.CHAT_PORT;
const NEW_CHAT_MESSAGE_EVENT = "newChatMessage";

io.on("connection", (socket) => {
	console.log(`Client ${socket.id} connected`);

	// Join a conversation
	const { roomId } = socket.handshake.query;
	socket.join(roomId);

	// Listen for new messages
	socket.on(NEW_CHAT_MESSAGE_EVENT, async (data) => {
		io.in(roomId).emit(NEW_CHAT_MESSAGE_EVENT, data);
		console.log(data)
		let message = {
			user: data.user._id,
			text: data.body
		}
		await messages.create(message).then(async (messageDB)=>{
			//console.log(messageDB);
			await chats.findOneAndUpdate(
				{_id: roomId}, 
				{$push: {messages : messageDB._id}}, 
				{new : true}
			).then((result)=>{
				console.log("Success in adding messageID to chat message array")
			}).catch((error)=>{
				console.log(error);
			})
		}).catch((error)=>{
			console.log(error);
		})
	});

	// Leave the room if the user closes the socket
	socket.on("disconnect", () => {
		console.log(`Client ${socket.id} disconnected`);
		socket.leave(roomId);
	});
});

server.listen(PORT, () => {
	console.log(`Chat server on port ${PORT}`);
});
