const polka = require('polka');
const items = require('./items');

module.exports = polka().use('items', items);
