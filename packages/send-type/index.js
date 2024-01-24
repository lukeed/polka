const { STATUS_CODES } = require('http');

const TYPE = 'content-type';
const OSTREAM = 'application/octet-stream';

module.exports = function (res, code=200, data='', headers={}) {
	// biome-ignore lint: ignore
	let k, obj = {};
	for (k in headers) {
		obj[k.toLowerCase()] = headers[k];
	}

	let type = obj[TYPE] || res.getHeader(TYPE);

	if (!!data && typeof data.pipe === 'function') {
		obj[TYPE] = type || OSTREAM;
		for (k in obj) {
		  res.setHeader(k, obj[k]);
		}
		return data.pipe(res);
	}

	if (data instanceof Buffer) {
		type = type || OSTREAM; // prefer given
	} else if (typeof data === 'object') {
		// biome-ignore lint: ignore
		data = JSON.stringify(data);
		type = type || 'application/json;charset=utf-8';
	} else {
		// biome-ignore lint: ignore
		data = data || STATUS_CODES[code];
	}

	obj[TYPE] = type || 'text/plain';
	obj['content-length'] = Buffer.byteLength(data);

	res.writeHead(code, obj);
	res.end(data);
}
