const polka = require('../lib');

function one(req, res, next) {
	req.one = true;
	next();
}

function two(req, res, next) {
	req.two = true;
	next();
}

polka()
	.use(one, two)
	.get('/favicon.ico', _ => {})
	.get('/', (req, res) => res.end('Hello'))
	.get('/user/:id', (req, res) => {
		res.end(`User: ${req.params.id}`);
	})
	.listen(3000);
