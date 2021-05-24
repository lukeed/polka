import { ServerResponse } from 'http';

// IncomingMessage
export class Request {
	constructor(method = 'GET', headers = {}) {
		this.method = method.toUpperCase();
		this.headers = {};
		for (let i in headers) this.headers[i.toLowerCase()] = headers[i];
	}
}

export class Response extends ServerResponse {
	constructor(req) {
		super(req);
		this._chunks = [];
		this.done = new Promise((resolve) => this._done = resolve);
	}
	/** @param chunk @param [enc] @param [cb] */
	write(chunk, enc, cb) {
		if (!Buffer.isBuffer(chunk)) chunk = Buffer.from(chunk, enc);
		this._chunks.push(chunk);
		if (cb) cb(null);
		return true;
	}
	/** @param chunk @param [enc] @param [cb] */
	end(chunk, enc, cb) {
		if (chunk) this.write(chunk, enc);
		if (cb) cb();
		this._done(Buffer.concat(this._chunks));
	}
	getResponseData() {
		return this.done;
	}
	async getResponseText() {
		return (await this.done).toString();
	}
}

export function prep(method, encoding) {
	let req = new Request(method, { 'Accept-Encoding': encoding });
	let res = new Response(req);
	return { req, res };
}

export const toAscii = thing => JSON.stringify(Buffer.from(thing).toString('ascii')).replace(/(^"|"$)/g,'');
