const http = require('http');
const Router = require('trouter');
const parseurl = require('parseurl');

function strip(x) {
	return x.charCodeAt(0) === 47 ? x.substring(1) : x;
}

function value(x) {
  let y = x.indexOf('/', 1);
  return y > 1 ? x.substring(1, y) : x.substring(1);
}

function onError(err, req, res, next) {
	let code = (res.statusCode = err.code || err.status || 500);
	res.end(err.message || err.toString() || http.STATUS_CODES[code]);
}

class Polka extends Router {
	constructor(opts={}) {
		super(opts);
		this.apps = {};
		this.wares = [];
		this.bwares = {};
		this.parse = parseurl;
		this.listen = this.start;
		this.handler = this.handler.bind(this);
		this.server = http.createServer(this.handler);
		this.onError = opts.onError || onError; // catch-all handler
		this.onNoMatch = opts.onNoMatch || this.onError.bind(null, { code:404 });
	}

	use(base, ...fns) {
		if (typeof base === 'function') {
			this.wares = this.wares.concat(base, fns);
		} else {
			base = strip(base);
			fns.forEach(fn => {
				if (fn instanceof Polka) {
					this.apps[base] = fn;
				} else {
					this.bwares[base] = (this.bwares[base] || []).concat(fn);
				}
			});
		}
		return this; // chainable
	}

	start(port, hostname) {
		return new Promise((res, rej) => {
			this.server.listen(port, hostname, err => err ? rej(err) : res());
		});
	}

	handler(req, res, info) {
		info = info || this.parse(req);
		let fn, arr=this.wares, obj=this.find(req.method, info.pathname);
		if (obj) {
			fn = obj.handler;
			req.params = obj.params;
		} else {
			// Looking for sub-apps or extra middleware
			let base = value(info.pathname);
			req.originalUrl = req.url; // for somebody?
			req.url = '/' + strip(req.url.substring(base.length + 1));
			info.pathname = '/' + strip(info.pathname.substring(base.length + 1));
			if (this.apps[base] !== void 0) {
				fn = this.apps[base].handler.bind(null, req, res, info);
			} else {
				arr = arr.concat(this.bwares[base] || []);
				fn = this.onNoMatch;
			}
		}
		// Grab addl values from `info`
		req.pathname = info.pathname;
		req.search = info.search;
		req.query = info.query;
		// Exit if no middleware
		let i=0, len=arr.length;
		if (len === i) return fn(req, res);
		// Otherwise loop thru all middlware
		let next = err => err ? this.onError(err, req, res, next) : loop();
		let loop = _ => res.finished || (i < len) ? arr[i++](req, res, next) : fn(req, res);
		loop(); // init
	}
}

module.exports = opts => new Polka(opts);
