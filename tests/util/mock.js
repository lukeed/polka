// Incomplete but sufficient mock
class Response {
	constructor() {
		this.body = '';
		this.headers = {};
		this.statusCode = 200;
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
	hasHeader(key) {
		return this.headers[key.toLowerCase()] !== void 0;
	}
}

exports.Response = Response;
