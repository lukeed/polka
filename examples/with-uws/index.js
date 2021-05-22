const { http } = require('uws');
const polka = require('polka');

const { PORT=3000 } = process.env;

const { handler } = polka().get('/', (req, res) => {
	res.end('Hello');
});

http.createServer(handler).listen(PORT, () => {
	console.log(`> Running on localhost:${PORT}`);
});
