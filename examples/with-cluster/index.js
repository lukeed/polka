const cluster = require('@polka/cluster');
const polka = require('polka');

const { PORT=3000 } = process.env;

const app = (
	polka()
		.get('/', (req, res) => res.end('OK'))
		.get('/:name?', (req, res) => {
			const { name='world' } = req.params;
			res.end(`Hello, ${name}`);
		})
);

cluster(app, 4).listen(PORT);
