const polka = require('polka');
const users = require('./users');

const { PORT=3000 } = process.env;

function reply(req, res) {
	res.end(`Main: Hello from ${req.method} ${req.url}`);
}

// Main app
polka()
	.use(users)
	.get('/', reply)
	.get('/about', reply)
	.listen(PORT).then(_ => {
		console.log(`> Running on localhost:${PORT}`);
	});
