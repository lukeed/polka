import { IncomingMessage, ServerResponse } from 'node:http';

// IncomingMessage
class Request {
	constructor(method = 'GET', headers = {}) {
		this.method = method.toUpperCase();
		this.headers = {};
		for (let i in headers) {
			this.headers[i.toLowerCase()] = headers[i];
		}
	}
}

class Response extends ServerResponse {
	constructor(req) {
		super(req);
		this._chunks = [];
		this.done = new Promise(r => this._done = r);
	}
	write(chunk, enc, cb) {
		if (!Buffer.isBuffer(chunk)) chunk = Buffer.from(chunk, enc);
		this._chunks.push(chunk);
		if (cb) cb(null);
		return true;
	}
	end(chunk, enc, cb) {
		if (chunk) this.write(chunk, enc);
		if (cb) cb();
		this._done(Buffer.concat(this._chunks));
		return this;
	}
	getResponseData() {
		return this.done;
	}
	async getResponseText() {
		return (await this.done).toString();
	}
}

/**
 * @param {string} method
 * @param {string} encoding
 * @returns {{ req: IncomingMessage, res: Response }}
 */
export function prepare(method, encoding) {
	let req = new Request(method, {
		'Accept-Encoding': encoding,
	});
	let res = new Response(req);
	// @ts-expect-error
	return { req, res };
}

export function toAscii(thing) {
	return JSON.stringify(
		Buffer.from(thing).toString('ascii')
	).replace(/(^"|"$)/g,'');
}
