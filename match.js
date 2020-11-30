require('dotenv').config()
const prelinks = require('./models/prelink');
const links = require('./models/link');

const delay = 10000;

async function createLinks() {
	let d = new Date();
	let t = d.toUTCString();
	console.log(t);
	
	let results = await prelinks.aggregate([
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
				'user2': { $last: '$user' }
			}
		}
	]);
	console.log(results);
}

setTimeout(async function timer() {
	await createLinks();
	setTimeout(timer, delay);
}, delay);
