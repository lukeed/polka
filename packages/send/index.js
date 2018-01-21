const { STATUS_CODES } = require('http');

module.exports = function (res, code=200, data='', headers={}) {
	res.writeHead(code, headers);
	res.end(data || STATUS_CODES[code]);
}
