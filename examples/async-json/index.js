const fetch = require('node-fetch');
const server = require('polka')();

const { PORT=3000 } = process.env;
const API = 'https://hnpwa.com/api/v0';

function load(type) {
	return fetch(`${API}/${type}.json`).then(r => r.json());
}

server
	.get('/:type?', async (req, res) => {
		let type = req.params.type || 'news';
		let data = await load(type)
			.catch(err => server.send(res, 404))
			.then(JSON.stringify);
		// success!
		server.send(res, 200, data, 'application/json');
	})
	.listen(PORT).then(_ => {
		console.log(`> Running on localhost:${PORT}`);
	});
