const polka = require('polka');
const sapper = require('sapper')();
const static = require('serve-static')('assets');
const compression = require('compression')({ threshold:0 });

const { PORT=3000 } = process.env;

// this allows us to do e.g. `fetch('/api/blog')` on the server
const fetch = require('node-fetch');
global.fetch = (url, opts) => {
	if (url[0] === '/') url = `http://localhost:${PORT}${url}`;
	return fetch(url, opts);
};

polka()
	.use(compression, static, sapper)
	.listen(PORT, err => {
		if (err) throw err;
		console.log(`> Running on localhost:${PORT}`);
	});
