import { STATUS_CODES } from 'node:http';

export const toStatusText = code => STATUS_CODES[code];

// Incomplete but sufficient mock
export class Response {
	constructor(req={}) {
		this.body = '';
		this.statusCode = 200;
		this.headers = new Map();
		this.socket = {
			parser: { incoming:req }
		};
	}
	end(str) {
		this.body = str;
	}
	writeHead(int, obj) {
		this.statusCode = int;
		for (let k in obj) {
			this.headers.set(k, obj[k]);
		}
	}
	getHeaders() {
		let out = {};
		this.headers.forEach((v, k) => out[k] = v);
		return out;
	}
	getHeaderNames() {
		return [...this.headers.keys()];
	}
	getHeader(key) {
		let iter = this.headers.entries();
		let arr, rgx = new RegExp(`^(${key})$`, 'i');
		for (arr of iter) if (rgx.test(arr[0])) return arr[1];
	}
	setHeader(key, val) {
		this.headers.set(key, val);
	}
	removeHeader(key) {
		this.headers.delete(key);
	}
	hasHeader(key) {
		return this.headers.has(key);
	}
}
