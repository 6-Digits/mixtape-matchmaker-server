require('dotenv').config()
const prelinks = require('./models/prelink');
const chats = require('./models/chat')
const links = require('./models/link');
const notifications = require('./models/notification')
const accounts = require('./models/account')
const io = require('./notificationServer').io;
const delay = 60000;

async function createLinks() {
	let matches;
	try {
		matches = await prelinks.aggregate([
			{
				$lookup: {
					from: 'prelinks',
					localField: 'liker',
					foreignField: 'user',
					as: 'linkInfo'
				}
			},
			{
				$replaceRoot: {
					newRoot: {
						$mergeObjects: [ { $arrayElemAt: [ "$linkInfo", 0 ] }, "$ROOT" ]
					}
				}
			},
			{
				$group: {
					_id: '$_id',
					'user1': { $first: '$liker' },
					'user2': { $last: '$user' },
				}
			}
		]);
	}
	catch (exception) {
		matches = {};
	}
	let count = 0;
	if (matches.length > 1) {
		let set = new Set();
		matches.forEach(async (match) => {
			count += 1;
			let user1 = match['user1'];
			let user2 = match['user2'];
			if (!set.has([user1, user2].toString()) && !set.has([user2, user1].toString())) {
				set.add([user1, user2].toString());
				await chats.create({
					user1: user1,
					user2: user2,
					creationDate: Date.now()
				}).catch((error) => {
					console.log(error);
				})
			};
			// Notification ping for user 1
			let notification1 = {
				user: user1,
				message: "A new match was found",
				time: Date.now(),
			}
			await accounts.findById(user1).then(async(accountDB)=>{
				if (accountDB.allowNotifications){
					// This is where the server emits back the message to a reciever
					io.in(user1).emit(NEW_NOTIFICATION_EVENT, notification1);
					notifications.create(notification1).then((result)=>{
						console.log("Success in creating a notification in DB")
					}).catch((error)=>{
						console.log("Error in creating a notification in DB")
					})
				}
			})
			// Notification ping for user 2
			let notification2 = {
				user: user2,
				message: "A new match was found",
				time: Date.now(),
			}
			await accounts.findById(user2).then(async(accountDB)=>{
				if (accountDB.allowNotifications){
					// This is where the server emits back the message to a reciever
					io.in(user2).emit(NEW_NOTIFICATION_EVENT, notification2);
					notifications.create(notification2).then((result)=>{
						console.log("Success in creating a notification in DB")
					}).catch((error)=>{
						console.log("Error in creating a notification in DB")
					})
				}
			})
			await prelinks.deleteOne( { _id: match['_id'] } ).catch((error) => {
				console.log(error);
			}).catch((error)=>{
				console.log(error)
			})
		});
	}
	return count;
}

setTimeout(async function timer() {
	await createLinks();
	setTimeout(timer, delay);
}, delay);
