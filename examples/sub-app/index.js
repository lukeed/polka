const polka = require('polka');
const users = require('./users');

const { PORT=3000 } = process.env;

function reply(req, res) {
	res.end(`Main: Hello from ${req.method} ${req.url}`);
}

// Main app
polka()
	.get('/', reply)
	.get('/about', reply)
	.use('users', users)
	.listen(PORT, err => {
		if (err) throw err;
		console.log(`> Running on localhost:${PORT}`);
	});
