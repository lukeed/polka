import { STATUS_CODES } from 'node:http';
import { createHash } from 'node:crypto';

const TYPE = 'Content-Type';
const LENGTH = 'Content-Length';
const OSTREAM = 'application/octet-stream';

export default function (res, code=200, data='', headers={}) {
	let k, obj={};
	for (k in headers) {
		obj[k.toLowerCase()] = headers[k];
	}

	let type = obj[TYPE.toLowerCase()] || res.getHeader(TYPE);

	if (!!data && typeof data.pipe === 'function') {
		obj[TYPE] = type || OSTREAM;
		for (k in obj) {
		  res.setHeader(k, obj[k]);
		}
		return data.pipe(res);
	}

	if (data instanceof Buffer) {
		type = type || OSTREAM;
	} else if (typeof data === 'object') {
		data = JSON.stringify(data);
		type = type || 'application/json; charset=utf-8';
	} else {
		data = data || STATUS_CODES[code] || String(code);
	}

	obj[TYPE] = type || 'text/plain';
	obj[LENGTH] = Buffer.byteLength(data);
	delete obj[LENGTH.toLowerCase()];
	delete obj[TYPE.toLowerCase()];

	if (obj.etag) {
		let hash = createHash('sha1').update(data).digest('base64').substring(0, 27);
		res.setHeader('ETag', `W/"${obj[LENGTH].toString(16)}-${hash}"`);
		delete obj.etag;
	}

	if (code === 204 || code === 304) {
		res.removeHeader(TYPE);
		res.removeHeader(LENGTH);
		delete obj[LENGTH];
		delete obj[TYPE];
		data = '';
	} else if (res.socket.parser && res.socket.parser.incoming.method === 'HEAD') {
		data = '';
	}

	res.writeHead(code, obj);
	res.end(data);
}
