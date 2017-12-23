const polka = require('../lib');

// const sleep = ms => new Promise(r => setTimeout(r, ms));

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
	.get('/user/:id', (req, res) => {
		res.end(`User: ${req.params.id}`);
	})
	.listen(3000);
