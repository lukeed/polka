import { decode } from 'node:querystring';

const noop = x => x;

export function parse(opts={}) {
	const { type, encoding='utf-8', parser=noop } = opts;
	const limit = opts.limit || 100 * 1024; // 100kb

	return function (req, res, next) {
		if (req._body) return next();
		req.body = req.body || {};

		const head = req.headers;
		const ctype = head['content-type'];
		const clength = parseInt(head['content-length'], 10);

		if (isNaN(clength) && head['transfer-encoding'] == null) return next(); // no body
		if (ctype && !ctype.includes(type)) return next(); // not valid type
		if (clength === 0) return next(); // is empty

		if (encoding) {
			req.setEncoding(encoding);
		}

		let bits = '';
		let length = 0;
		req.on('data', x => {
			length += Buffer.byteLength(x);
			if (length <= limit) {
				bits += x;
			} else {
				let err = new Error('Exceeded "Content-Length" limit');
				err.status = 413;
				next(err);
			}
		}).on('end', () => {
			try {
				req.body = parser(bits);
				req._body = true;
				next();
			} catch (err) {
				err.status = 422;
				err.details = err.message;
				err.message = 'Invalid content';
				next(err);
			}
		}).on('error', next);
	};
}

export function json(opts={}) {
	const { limit, parser=JSON.parse } = opts;
	const type = opts.type || 'application/json';
	return parse({ type, parser, limit });
}

export function urlencoded(opts={}) {
	const { parser=decode, limit } = opts;
	const type = opts.type || 'application/x-www-form-urlencoded';
	return parse({ type, parser, limit });
}

export function raw(opts={}) {
	const { limit, encoding=null } = opts;
	const type = opts.type || 'application/octet-stream';
	return parse({ limit, type, encoding });
}

export function text(opts={}) {
	const { limit, type='text/plain' } = opts;
	return parse({ limit, type });
}
