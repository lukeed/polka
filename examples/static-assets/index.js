const path = require('path');
const serveStatic = require('serve-static');
const polka = require('../../lib');
const server = polka();

const {PORT=3000} = process.env;

server
	.use(serveStatic('static'))
	.get('/', async (req, res) => {
		// success!
		res.end('hello world');
	})
	.listen(PORT)
	.then(_ => {
		console.log(`> Running on localhost:${PORT}`);
	});
