const polka = require('polka');
const { send } = require('./util');

module.exports = polka()
	.get('/', (req, res) => {
		send(res, 'items@index');
	})
	.post('/', (req, res) => {
		send(res, 'items@create');
	})
	.get('/:id', (req, res) => {
		send(res, `items@show(${req.params.id})`);
	})
	.put('/:id', (req, res) => {
		send(res, `items@edit(${req.params.id})`);
	})
	.delete('/:id', (req, res) => {
		send(res, `items@delete(${req.params.id})`);
	});
