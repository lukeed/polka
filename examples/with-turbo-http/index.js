const polka = require('polka');
const http = require('turbo-http');

const { PORT=3000 } = process.env;

const { handler } = polka().get('/', (req, res) => {
	res.end('Hello');
});

http.createServer(handler).listen(PORT, err => {
	console.log(`> Running on localhost:${PORT}`);
});
