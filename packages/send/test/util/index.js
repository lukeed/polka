import { STATUS_CODES } from 'http';

export const toStatusText = code => STATUS_CODES[code];

// Incomplete but sufficient mock
export class Response {
	constructor(req={}) {
		this.body = '';
		this.headers = {};
		this.statusCode = 200;
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
			this.headers[k.toLowerCase()] = obj[k];
		}
	}
	getHeaders() {
		return this.headers;
	}
	getHeaderNames() {
		let k, arr=[];
		for (k in this.headers) arr.push(k);
		return arr;
	}
	getHeader(key) {
		return this.headers[key.toLowerCase()];
	}
	setHeader(key, val) {
		this.headers[key.toLowerCase()] = val;
	}
	removeHeader(key) {
		delete this.headers[key.toLowerCase()];
	}
	hasHeader(key) {
		return this.headers[key.toLowerCase()] !== void 0;
	}
}
