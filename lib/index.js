const http = require('http');
const Router = require('trouter');
const { resolve } = require('path');
const parser = require('parseurl');

class Polka extends Router {
	constructor(opts) {
		super(opts);
		this.wares = [];
		this.parse = parser;
		this.listen = this.start;
		this.handler = this.handler.bind(this);
		this.server = http.createServer(this.handler);
	}

	use(...fn) {
		this.wares = this.wares.concat(fn);
		return this; // chainable
	}

	start(port, hostname) {
		return new Promise((res, rej) => {
			this.server.listen(port, hostname, err => err ? rej(err) : res());
		});
	}

	send(res, code, body, type) {
		code = code || 200;
		res.writeHead(code, {
			'Content-Type': type || 'text/plain',
			'X-Powered-By': 'Polka'
		});
		res.end(body || http.STATUS_CODES[code]);
	}

	handler(req, res, info) {
		let uri = req.url;
		info = info || this.parse(req);

		// Only do work if route is found~!
		// console.log(`${ req.method } on ${ uri }`);
		let obj = this.find(req.method, uri);
		if (!obj) return this.send(res, 501);

		// Provide `req.params`
		req.params = obj.params;
		// Grab addl values from `info`
		req.pathname = info.pathname;
		req.search = info.search;
		req.query = info.query;

		// Loop thru all middlware
		let i=0, arr=this.wares, len=arr.length;

		while (i < len) {
			arr[i](req, res, err => {
				if (err) return this.send(res, err.code || 500, err.toString());
				i++; // next cycle
			});
		}

		// Run route's callback
		return obj.handler(req, res);
	}
}

module.exports = opts => new Polka(opts);
