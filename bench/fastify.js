const fastify = require('fastify');

function one(req, res, next) {
	req.one = true;
	next();
}

function two(req, res, next) {
	req.two = true;
	next();
}

fastify()
	.use(one)
	.use(two)
	.get('/favicon.ico', _ => {})
	.get('/', (_, res) => res.send('Hello'))
	.get('/user/:id', (req, res) => {
		res.send(`User: ${req.params.id}`);
	})
	.listen(3000);
