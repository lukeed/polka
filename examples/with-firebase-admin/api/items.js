const polka = require('polka');
const send = require('@polka/send-type');
const { DB, isUser } = require('./services');

const ITEMS = DB.ref('items');

module.exports = polka()
	.use(isUser) // verify token
	.get('/', (req, res) => {
		ITEMS.once('value').then(s => {
			let k, out=[], obj=s.val();
			for (k in obj) {
				(obj[k].id=k) && out.push(obj[k]);
			}
			send(res, 200, out);
		});
	})
	.post('/', (req, res) => {
		let obj = req.body;
		ITEMS.push(req.body).then(data => {
			obj.id = data.key;
			send(res, 201, obj);
		});
	})
	.get('/:id', (req, res) => {
		ITEMS.child(req.params.id).then(s => {
			let obj = s.val();
			obj.id = s.key;
			send(res, 200, obj);
		});
	})
	.put('/:id', (req, res) => {
		let obj = req.body;
		ITEMS.child(req.params.id).set(obj).then(data => {
			send(res, 200, obj);
		});
	})
	.delete('/:id', (req, res) => {
		ITEMS.child(req.params.id).remove().then(_ => {
			send(res, 204);
		});
	});
