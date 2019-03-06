const { STATUS_CODES } = require('http');

const TYPE = 'Content-Type';
const LENGTH = 'Content-Length';
const OSTREAM = 'application/octet-stream';

module.exports = function (res, code=200, data='', headers={}) {
	let k, obj={};
	for (k in headers) {
		obj[k.toLowerCase()] = headers[k];
	}

	let type = obj[TYPE.toLowerCase()] || res.getHeader(TYPE);

	if (!!data && typeof data.pipe === 'function') {
		res.setHeader(TYPE, type || OSTREAM);
		return data.pipe(res);
	}

	if (data instanceof Buffer) {
		type = type || OSTREAM;
	} else if (typeof data === 'object') {
		data = JSON.stringify(data);
		type = type || 'application/json; charset=utf-8';
	} else {
		data = data || STATUS_CODES[code];
	}

	obj[TYPE] = type || 'text/plain';
	obj[LENGTH] = Buffer.byteLength(data);

	res.writeHead(code, obj);
	res.end(data);
}
