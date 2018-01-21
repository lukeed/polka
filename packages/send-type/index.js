const { STATUS_CODES } = require('http');

const TYPE = 'Content-Type';
const OSTREAM = 'application/octet-stream';

module.exports = function (res, code=200, data='', headers={}) {
	let type = headers[TYPE];

	if (!!data && typeof data.pipe === 'function') {
		res.setHeader(TYPE, type || OSTREAM);
		return data.pipe(res);
	}

	if (data instanceof Buffer) {
		type = type || OSTREAM; // prefer given
	} else if (typeof data === 'object') {
		data = JSON.stringify(data);
		type = 'application/json;charset=utf-8';
	} else {
		data = data || STATUS_CODES[code];
	}

	headers[TYPE] = type || 'text/plain';
	headers['Content-Length'] = Buffer.byteLength(data);

	res.writeHead(code, headers);
	res.end(data);
}
