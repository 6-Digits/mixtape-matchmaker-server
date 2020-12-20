const messages = require('../models/message');
const chats = require('../models/chat');
const notifications = require('../models/notification')
const accounts = require('../models/account')

const NEW_CHAT_MESSAGE_EVENT = "newChatMessage";
const NEW_NOTIFICATION_EVENT = "newNotificationEvent";

function createSockets(io) {
	io.on("connection", (socket) => {
		// Join a conversation
		const { roomId } = socket.handshake.query;
		socket.join(roomId);

		// Listen for new chat messages
		socket.on(NEW_CHAT_MESSAGE_EVENT, async (data) => {
			io.in(roomId).emit(NEW_CHAT_MESSAGE_EVENT, data);
			let message = {
				user: data.user._id,
				text: data.body
			}
			await messages.create(message).then(async (messageDB) => {
				await chats.findOneAndUpdate(
					{_id: roomId}, 
					{$push: {messages : messageDB._id}}, 
					{new : true}
				).catch((error) => {
					console.log(error);
				})
			}).catch((error) => {
				console.log(error);
			})
		});
		
		// Listen for new notification messages
		socket.on(NEW_NOTIFICATION_EVENT, async (data) => {
			let notification = {
				user: data.receiver,
				message: data.message,
				time: Date.now(),
			}
			await accounts.findById(data.receiver).then(async(accountDB)=>{
				if (accountDB.allowNotifications){
					// This is where the server emits back the message to a receiver
					io.in(data.receiver).emit(NEW_NOTIFICATION_EVENT, notification);
					notifications.create(notification).then((result) => {
						console.log("Success in creating a notification in DB")
					}).catch((error) => {
						console.log("Error in creating a notification in DB")
					})
				}
			}).catch((error) => {
				console.log("Error finding the account")
				console.log(error)
			})
		});

		// Leave the room if the user closes the socket
		socket.on("disconnect", () => {
			socket.leave(roomId);
		});
	});
}

module.exports = createSockets;
