import http from 'http';
import Router from 'trouter';
import parser from '@polka/url';

function onError(err, req, res) {
	let code = (res.statusCode = err.code || err.status || 500);
	if (typeof err === 'string' || Buffer.isBuffer(err)) res.end(err);
	else res.end(err.message || http.STATUS_CODES[code]);
}

const mount = fn => fn instanceof Polka ? fn.attach : fn;

class Polka extends Router {
	constructor(opts={}) {
		super();
		this.parse = parser;
		this.server = opts.server;
		this.handler = this.handler.bind(this);
		this.onError = opts.onError || onError; // catch-all handler
		this.onNoMatch = opts.onNoMatch || this.onError.bind(null, { code:404 });
		this.attach = (req, res) => setImmediate(this.handler, req, res);
	}

	use(base, ...fns) {
		if (base === '/') {
			super.use(base, fns.map(mount));
		} else if (typeof base === 'function' || base instanceof Polka) {
			super.use('/', [base, ...fns].map(mount));
		} else {
			super.use(base,
				(req, _, next) => {
					if (typeof base === 'string') {
						let len = base.length;
						base.startsWith('/') || len++;
						req.url = req.url.substring(len) || '/';
						req.path = req.path.substring(len) || '/';
					} else {
						req.url = req.url.replace(base, '') || '/';
						req.path = req.path.replace(base, '') || '/';
					}
					if (req.url.charAt(0) !== '/') {
						req.url = '/' + req.url;
					}
					next();
				},
				fns.map(mount),
				(req, _, next) => {
					req.url = req._parsedUrl.href;
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
		let info = this.parse(req, true);
		let obj = this.find(req.method, req.path=info.pathname);

		req.params = obj.params;
		req.originalUrl = req.originalUrl || req.url;
		req.query = info.query || {};
		req.search = info.search;

		try {
			let i=0, arr=obj.handlers.concat(this.onNoMatch), len=arr.length;
			let loop = () => res.finished || (i < len) && arr[i++](req, res, next);
			next = next || (err => err ? this.onError(err, req, res, next) : loop());
			loop(); // init
		} catch (err) {
			this.onError(err, req, res, next);
		}
	}
}

export default function (opts) {
	return new Polka(opts);
}
