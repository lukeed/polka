const polka = require('polka');
const { json } = require('body-parser');
const { PORT=3000 } = process.env;

polka()
	.use(json())
	.post('/', (req, res) => {
		res.writeHead(200, { 'Content-Type': 'application/json' });
		let json = JSON.stringify(req.body);
		res.end(json);
	})
	.listen(PORT, err => {
		if (err) throw err;
		console.log(`> Running on localhost:${PORT}`);
	});
