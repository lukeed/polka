const { createServer } = require('https');
const { readFileSync } = require('fs');
const polka = require('polka');

const { PORT=3000 } = process.env;

const options = {
  key: readFileSync('ssl/foobar.key'),
  cert: readFileSync('ssl/foobar.crt')
};

// Main app
const { handler } = polka().get('*', (req, res) => {
	res.end(`POLKA: Hello from ${req.pathname}`);
});

// Mount Polka to HTTPS server
createServer(options, handler).listen(PORT, _ => {
	console.log(`> Running on https://localhost:${PORT}`);
});
