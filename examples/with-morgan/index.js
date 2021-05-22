const polka = require('polka');
const morgan = require('morgan');
const { send } = require('./util');
const items = require('./items');

const { PORT=3000 } = process.env;

// init Polka (HTTP) server
polka()
	.use(morgan('dev'))
	.use('/items', items)
	.get('/', (req, res) => {
		send(res, 'Index');
	})
	.listen(PORT, () => {
		console.log(`> Ready on localhost:${PORT}`);
	});
