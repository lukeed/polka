const http = require('http');
const Router = require('trouter');
const { parse } = require('querystring');
const parser = require('@polka/url');

function onError(err, req, res) {
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
		this.attach = (req, res) => setImmediate(this.handler, req, res);
	}

	use(base, ...fns) {
		if (typeof base === 'function') {
			this.wares = this.wares.concat(base, fns);
		} else if (base === '/') {
			this.wares = this.wares.concat(fns);
		} else {
			base.startsWith('/') || (base=`/${base}`);
			super.use(base,
				(req, _, next) => {
					req.url = req.url.substring(base.length) || '/';
					req.path = req.path.substring(base.length) || '/';
					next();
				},
				...fns.map(fn => fn instanceof Polka ? fn.attach : fn),
				(req, _, next) => {
					req.url = req._parsedUrl.url;
					req.path = req._parsedUrl.pathname;
					next()
				}
			);
		}
		return this; // chainable
	}

	listen() {
		(this.server = this.server || http.createServer()).on('request', this.attach);
		this.server.listen.apply(this.server, arguments);
		return this;
	}

	handler(req, res, next) {
		let info = this.parse(req);
		let obj = this.find(req.method, req.path=info.pathname);

		req.params = obj.params;
		req.originalUrl = req.originalUrl || req.url;
		req.query = info.query ? parse(info.query) : {};
		req.search = info.search;

		try {
			let i=0, arr=this.wares.concat(obj.handlers, this.onNoMatch), len=arr.length;
			let loop = () => res.finished || (i < len) && arr[i++](req, res, next);
			next = next || (err => err ? this.onError(err, req, res, next) : loop());
			loop(); // init
		} catch (err) {
			this.onError(err, req, res, next);
		}
	}
}

module.exports = opts => new Polka(opts);
