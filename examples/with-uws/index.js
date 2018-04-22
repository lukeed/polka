const { http } = require('uws');
const polka = require('polka');

const { PORT=3000 } = process.env;

polka({ server: http }).get('/', (req, res) => {
	res.end('Hello');
}).listen(PORT, err => {
	console.log(`> Running on localhost:${PORT}`);
});
