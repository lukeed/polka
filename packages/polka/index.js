const http = require('http');
// const Router = require('trouter');
const Router = require('./trouter');
const { parse } = require('querystring');
const parser = require('@polka/url');

function mutate(str, req) {
	if (req.path.indexOf(str) !== 0) return;
	req.url = req.url.substring(str.length) || '/';
	req.path = req.path.substring(str.length) || '/';
}

function onError(err, req, res, next) {
	let code = (res.statusCode = err.code || err.status || 500);
	res.end(err.length && err || err.message || http.STATUS_CODES[code]);
}

class Polka extends Router {
	constructor(opts={}) {
		super();
		this.wares = [];
		this.parse = parser;
		this.server = opts.server;
		this.handler = this.handler.bind(this);
		this.onError = opts.onError || onError; // catch-all handler
		this.onNoMatch = opts.onNoMatch || this.onError.bind(null, { code:404 });
	}

	use(base, ...fns) {
		if (typeof base === 'function') {
			this.wares = this.wares.concat(base, fns);
		} else if (base === '/') {
			this.wares = this.wares.concat(fns);
		} else {
			if (base.charCodeAt(0) !== 47) base=('/' + base);
			this.add('', base, (r, _, nxt) => (mutate(base, r),nxt()));
			fns.forEach(fn => {
				this.add('', base, fn instanceof Polka ? fn.handler : fn);
			});
		}
		return this; // chainable
	}

	listen() {
		(this.server = this.server || http.createServer()).on('request', this.handler);
		this.server.listen.apply(this.server, arguments);
		return this;
	}

	handler(req, res, next) {
		let info = this.parse(req);
		let obj = this.find(req.method, req.path=info.pathname);
		let fns = obj.handlers.concat(this.onNoMatch);

		req.params = obj.params;
		req.originalUrl = req.originalUrl || req.url;
		req.query = info.query ? parse(info.query) : {};
		req.search = info.search;

		let i=0, arr=this.wares, len=arr.length, num=fns.length;
		next = next || (err => err ? this.onError(err, req, res, next) : loop());
		let loop = _ => res.finished || (i < len) && arr[i++](req, res, next);
		arr = arr.concat(fns);
		len += num;
		loop(); // init
	}
}

module.exports = opts => new Polka(opts);
