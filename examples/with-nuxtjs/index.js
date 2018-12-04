const polka = require('polka');
const { Nuxt, Builder } = require('nuxt');

const { PORT=3000, NODE_ENV } = process.env;

const dev = NODE_ENV !== 'production';
const nuxt = new Nuxt({ dev });
const app = polka();

// Render every route with Nuxt.js
app.use(nuxt.render);

// Build only in dev mode with hot-reloading
if (dev) {
	new Builder(nuxt).build()
	.then(listen)
	.catch((error) => {
		console.error(error);
		process.exit(1);
	})
} else {
	listen();
}

function listen() {
	return app.listen(PORT, err => {
		if (err) throw err;
		console.log(`> Ready on localhost:${PORT}`);
	});
}
