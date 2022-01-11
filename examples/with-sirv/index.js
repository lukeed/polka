const polka = require('polka');

const { PORT=3000 } = process.env;
const serve = require('sirv')('public');

polka()
	.use(serve)
	.get('/health', (req, res) => {
		res.end('OK');
	})
	.listen(PORT, () => {
		console.log(`> Running on localhost:${PORT}`);
	});
