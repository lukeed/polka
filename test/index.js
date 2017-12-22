const test = require('tape');
const polka = require('../lib');

test('polka', t => {
	t.is(typeof polka, 'function', 'exports a function');
	t.end();
});
