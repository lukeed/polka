const http = require('http');
const axios = require('axios');
const { test, Test } = require('tape');
const polka = require('../lib');

const $ = Test.prototype;
const METHODS = ['GET', 'POST', 'PUT', 'DELETE'];

$.isEmpty = function (val, msg) {
	this.ok(!Object.keys(val).length, msg);
}

$.isArray = function (val, msg) {
	this.ok(Array.isArray(val), msg);
}

$.isObject = function (val, msg) {
	this.ok(Boolean(val) && (val.constructor === Object), msg);
}

$.isFunction = function (val, msg) {
	this.is(typeof val, 'function', msg);
}

function listen(srv, host) {
	srv.listen(); // boots
	let { port } = srv.address();
	return `http://${host || 'localhost'}:${port}`;
}

test('polka', t => {
	t.is(typeof polka, 'function', 'exports a function');
	t.end();
});

test('internals', t => {
	let app = polka();
	let proto = app.__proto__;

	t.isObject(app.opts, 'app.opts is an object');
	t.isEmpty(app.opts, 'app.opts is empty');

	t.isArray(app.wares, 'app.wares is an array');
	t.isEmpty(app.wares, 'app.wares is empty');

	t.ok(app.server instanceof http.Server, 'app.server is an HTTP server');

	['parse', 'listen', 'handler'].forEach(k => {
		t.isFunction(app[k], `app.${k} is a function`);
	});

	['use', 'start', 'send', 'handler'].forEach(k => {
		t.isFunction(proto[k], `app.${k} is a prototype method`);
	});

	t.isObject(app.routes, 'app.routes is an object tree');
	t.isObject(app.handlers, 'app.handlers is an object tree');

	METHODS.forEach(k => {
		t.isFunction(app[k.toLowerCase()], `app.${k.toLowerCase()} is a function`);
		t.isArray(app.routes[k], `~> routes.${k} is an object`);
		t.isEmpty(app.routes[k], `~> routes.${k} is empty`);
		t.isObject(app.handlers[k], `~> handlers.${k} is an object`);
		t.isEmpty(app.handlers[k], `~> handlers.${k} is empty`);
	});

	t.end();
});

test('usage::basic', t => {
	t.plan(9);

	let app = polka();
	let arr = [['GET','/'], ['POST','/users'], ['PUT','/users/:id']];

	arr.forEach(([m,p]) => {
		app.add(m, p, _ => t.pass(`~> matched ${m}(${p}) route`));
		t.is(app.routes[m].length, 1, 'added a new `app.route` definition');
		t.isFunction(app.handlers[m][p], 'added a new `app.handler` function');
	});

	arr.forEach(([m, p]) => {
		app.find(m, p).handler();
	});
});

test('usage::middleware', t => {
	t.plan(7);

	let app = polka().use((req, res, next) => {
		(req.one='hello') && next();
	}).use((req, res, next) => {
		(req.two='world') && next();
	}).get('/', (req, res) => {
		t.pass('~> matches the GET(/) route');
		t.is(req.one, 'hello', '~> route handler runs after first middleware');
		t.is(req.two, 'world', '~> route handler runs after both middlewares!');
		res.setHeader('x-type', 'text/foo');
		res.end('Hello');
	});

	t.is(app.wares.length, 2, 'added 2 middleware functions');

	let uri = listen(app.server);
	axios.get(uri).then(r => {
		t.is(r.status, 200, '~> received 200 status');
		t.is(r.data, 'Hello', '~> received "Hello" response');
		t.is(r.headers['x-type'], 'text/foo', '~> received custom header');
		app.server.close();
	});
});

test('usage::errors', t => {
	t.plan(9);
	let a = 41;

	// next(Error)
	let foo = polka().use((req, res, next) => {
		(a += 1) && next(new Error('boo'));
	}).get('/', (req, res) => {
		a = 0; // wont run
		res.end('OK');
	});

	let u1 = listen(foo.server);
	axios.get(u1).catch(err => {
		let r = err.response;
		t.is(a, 42, 'exits before route handler if middleware error');
		t.is(r.data, 'Error: boo', '~> received "Error: boo" text');
		t.is(r.status, 500, '~> received 500 status');
		foo.server.close();
	});

	// next(string)
	let bar = polka().use((_, r, next) => {
		next('boo~!');
	}).get('/', (_, res) => {
		a = 123; // wont run
		res.end('OK');
	});

	let u2 = listen(bar.server);
	axios.get(u2).catch(err => {
		let r = err.response;
		t.is(a, 42, 'exits without running route handler');
		t.is(r.data, 'boo~!', '~> received "boo~!" text');
		t.is(r.status, 500, '~> received 500 status');
		bar.server.close();
	});

	// early res.end()
	let baz = polka().use((_, res) => {
		res.statusCode = 501;
		res.end('oh dear');
	}).get('/', (_, res) => {
		a = 42; // wont run
		res.end('OK');
	});

	let u3 = listen(baz.server);
	axios.get(u3).catch(err => {
		let r = err.response;
		t.is(a, 42, 'exits without running route handler');
		t.is(r.data, 'oh dear', '~> received "oh dear" (custom) text');
		t.is(r.status, 501, '~> received 501 (custom) status');
		baz.server.close();
	});
});
