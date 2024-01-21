const { join } = require('path');
const polka = require('polka');

const { PORT = 3000 } = process.env;
const dir = join(__dirname, 'public');
const assets = require('sirv')(dir);

polka()
	.use(assets)
	.get('/subscribe', (request, response) => {
		// You should add 'access-control-allow-origin' for
		// cross-origin requests. We don't here because localhost
		response.writeHead(200, {
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-cache',
			'Connection': 'keep-alive',
		});

		setInterval(() => {
			response.write('data: ' + Date.now() + '\n\n');
		}, 1e3);

		request.on('close', () => {
			response.end();
		});
	})
	.listen(PORT, () => {
		console.log(`> Running on http://localhost:${PORT}`);
	});
