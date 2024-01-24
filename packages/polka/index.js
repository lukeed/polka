const http = require('http');
const Router = require('trouter');
const { parse } = require('querystring');
const parser = require('@polka/url');

function lead(x) {
	return x.charCodeAt(0) === 47 ? x : (`/${x}`);
}

function value(x) {
  const y = x.indexOf('/', 1);
  return y > 1 ? x.substring(0, y) : x;
}

function mutate(str, req) {
	req.url = req.url.substring(str.length) || '/';
	req.path = req.path.substring(str.length) || '/';
}

function onError(err, req, res, next) {
	res.statusCode = err.code || err.status || 500;
	const code = res.statusCode;
	if (typeof err === 'string' || Buffer.isBuffer(err)) res.end(err);
	else res.end(err.message || http.STATUS_CODES[code]);
}

class Polka extends Router {
	constructor(opts={}) {
		super(opts);
		this.apps = {};
		this.wares = [];
		this.bwares = {};
		this.parse = parser;
		this.server = opts.server;
		this.handler = this.handler.bind(this);
		this.onError = opts.onError || onError; // catch-all handler
		this.onNoMatch = opts.onNoMatch || this.onError.bind(null, { code:404 });
	}

	add(method, pattern, ...fns) {
		const base = lead(value(pattern));
		if (this.apps[base] !== void 0) throw new Error(`Cannot mount ".${method.toLowerCase()}('${lead(pattern)}')" because a Polka application at ".use('${base}')" already exists! You should move this handler into your Polka application instead.`);
		return super.add(method, pattern, ...fns);
	}

	use(base, ...fns) {
		if (typeof base === 'function') {
			this.wares = this.wares.concat(base, fns);
		} else if (base === '/') {
			this.wares = this.wares.concat(fns);
		} else {
			// biome-ignore lint: ignore
			base = lead(base);
			for (const fn of fns) {
				if (fn instanceof Polka) {
					this.apps[base] = fn;
				} else {
					const arr = this.bwares[base] || [];
					// biome-ignore lint: ignore
					arr.length > 0 || arr.push((r, _, nxt) => (mutate(base, r),nxt()));
					this.bwares[base] = arr.concat(fn);
				}
			}
		}
		return this; // chainable
	}

	listen() {
		this.server = this.server || http.createServer();
		this.server.on('request', this.handler);
		// biome-ignore lint: ignore
		this.server.listen.apply(this.server, arguments);
		return this;
	}

	handler(req, res, info) {
		// biome-ignore lint: ignore
		info = info || this.parse(req);
		let fns=[];
		let arr=this.wares;
		const obj=this.find(req.method, info.pathname);
		req.originalUrl = req.originalUrl || req.url;
		req.path = info.pathname;
		const base = value(req.path);
		if (this.bwares[base] !== void 0) {
			arr = arr.concat(this.bwares[base]);
		}
		if (obj) {
			fns = obj.handlers;
			req.params = obj.params;
		} else if (this.apps[base] !== void 0) {
			mutate(base, req); info.pathname=req.path; //=> updates
			fns.push(this.apps[base].handler.bind(null, req, res, info));
		}
		fns.push(this.onNoMatch);
		// Grab addl values from `info`
		req.search = info.search;
		req.query = parse(info.query);
		// Exit if only a single function
		let i=0;
		let len=arr.length;
		const num=fns.length;
		if (len === i && num === 1) return fns[0](req, res);
		// Otherwise loop thru all middleware
		const next = err => err ? this.onError(err, req, res, next) : loop();
		const loop = _ => res.finished || (i < len) && arr[i++](req, res, next);
		arr = arr.concat(fns);
		len += num;
		loop(); // init
	}
}

module.exports = opts => new Polka(opts);
