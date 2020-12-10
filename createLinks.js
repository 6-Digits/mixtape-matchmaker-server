require('dotenv').config()
const prelinks = require('./models/prelink');
const chats = require('./models/chat')
const links = require('./models/link');

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
	
	if (matches.length > 1) {
		let set = new Set();
		matches.forEach(async (match) => {
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
			await prelinks.deleteOne( { _id: res['_id'] } ).catch((error) => {
				console.log(error);
			}).catch((error)=>{
				console.log(error)
			})
		});
	}
}

setTimeout(async function timer() {
	await createLinks();
	setTimeout(timer, delay);
}, delay);
