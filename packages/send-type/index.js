const { STATUS_CODES } = require('http');

const TYPE = 'content-type';
const OSTREAM = 'application/octet-stream';

module.exports = (res, code=200, data='', headers={}) => {
	let k;
	const obj = {};
	let _data = '';
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
		_data = JSON.stringify(data);
		type = type || 'application/json;charset=utf-8';
	} else {
		_data = data || STATUS_CODES[code];
	}

	obj[TYPE] = type || 'text/plain';
	obj['content-length'] = Buffer.byteLength(_data);

	res.writeHead(code, obj);
	res.end(_data);
}
