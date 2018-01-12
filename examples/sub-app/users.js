const polka = require('polka');

module.exports = polka()
	.get('/users/:id?', (req, res) => {
		res.end(`Sub: Howdy from ${req.method} ${req.url}`);
	})
	.put('/users/:id', (req, res) => {
		res.statusCode = 201; // why not?
		res.end(`Sub: Updated user via ${req.method} ${req.url}`);
	});
