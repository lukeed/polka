const fetch = require('node-fetch');
const send = require('@polka/send-type');
const polka = require('polka');

const { PORT=3000 } = process.env;
const API = 'https://hnpwa.com/api/v0';

function load(type) {
	return fetch(`${API}/${type}.json`).then(r => r.json());
}

polka()
	.get('/:type?', async (req, res) => {
		let type = req.params.type || 'news';
		let data = await load(type).catch(err => {
			send(res, 404);
		});
		send(res, 200, data);
	})
	.listen(PORT, () => {
		console.log(`> Running on localhost:${PORT}`);
	});
