const next = require('next');
const polka = require('polka');

const { PORT=3000, NODE_ENV } = process.env;

const dev = NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
	polka()
		.get('*', handle)
		.listen(PORT, () => {
			console.log(`> Ready on http://localhost:${PORT}`);
		});
});
