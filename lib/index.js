const http = require('http');
const Router = require('trouter');
const parseurl = require('parseurl');

class Polka extends Router {
	constructor(opts) {
		super(opts);
		this.wares = [];
		this.parse = parseurl;
		this.listen = this.start;
		this.handler = this.handler.bind(this);
		this.server = http.createServer(this.handler);
	}

	use(...fns) {
		fns.forEach(fn => {
			if (fn instanceof Polka) {
				let m, keys, obj=fn.handlers;
				for (m in obj) {
					if ((keys=Object.keys(obj[m])).length) {
						keys.forEach(uri => this.add(m, uri, obj[m][uri]));
					}
				}
			} else {
				this.wares.push(fn);
			}
		});
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
		info = info || this.parse(req);
		// Only do work if route is found~!
		let obj = this.find(req.method, info.pathname);
		if (!obj) return this.send(res, 501);
		// Provide `req.params`
		req.params = obj.params;
		// Grab addl values from `info`
		req.pathname = info.pathname;
		req.search = info.search;
		req.query = info.query;

		// Loop thru all middlware
		let i=0, arr=this.wares, len=arr.length;
		let next = err => err ? this.send(res, err.code || 500, err.toString()) : loop();
		let loop = _ => res.finished || (i < len) ? arr[i++](req, res, next) : obj.handler(req, res);

		loop(); // init
	}
}

module.exports = opts => new Polka(opts);
