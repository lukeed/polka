const http = require('http');
const axios = require('axios');
const polka = require('../packages/polka');
const { test, sleep, listen } = require('./util');

const METHODS = ['GET', 'POST', 'PUT', 'DELETE'];

test('polka', t => {
	t.is(typeof polka, 'function', 'exports a function');
	t.end();
});

test('polka::internals', t => {
	let app = polka();
	let proto = app.__proto__;

	t.isObject(app.opts, 'app.opts is an object');
	t.isEmpty(app.opts, 'app.opts is empty');

	t.isObject(app.apps, 'app.apps is an object');
	t.isEmpty(app.apps, 'app.apps is empty');

	t.isArray(app.wares, 'app.wares is an array');
	t.isEmpty(app.wares, 'app.wares is empty');

	t.isObject(app.bwares, 'app.bwares is an object');
	t.isEmpty(app.bwares, 'app.bwares is empty');

	t.ok(app.server instanceof http.Server, 'app.server is an HTTP server');

	t.isFunction(app.onError, 'app.onError is a function');
	t.isFunction(app.onNoMatch, 'app.onNoMatch is a function');

	['parse', 'listen', 'handler'].forEach(k => {
		t.isFunction(app[k], `app.${k} is a function`);
	});

	['use', 'start', 'handler'].forEach(k => {
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

test('polka::usage::basic', t => {
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

test('polka::usage::middleware', t => {
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

test('polka::usage::middleware (async)', t => {
	t.plan(7);

	let app = polka().use((req, res, next) => {
		sleep(10).then(_ => { req.foo=123 }).then(next);
	}).use((req, res, next) => {
		sleep(1).then(_ => { req.bar=456 }).then(next);
	}).get('/', (req, res) => {
		t.pass('~> matches the GET(/) route');
		t.is(req.foo, 123, '~> route handler runs after first middleware');
		t.is(req.bar, 456, '~> route handler runs after both middlewares!');
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

test('polka::usage::errors', t => {
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
		t.is(r.data, 'boo', '~> received "boo" text');
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

test('polka::usage::sub-apps', t => {
	t.plan(8);

	let foo = (req, res, next) => {
		req.foobar = 'hello';
		next();
	};

	let sub = polka().get('/sub', (req, res) => {
		t.pass('runs the sub-application route')
		t.is(req.foobar, 'hello', '~> receives mutatations from main-app middleware');
		res.end('hello from sub');
	});

	let app = polka().use(foo, sub).get('/', (req, res) => {
		t.pass('run the main-application route');
		t.is(req.foobar, 'hello', '~> receives mutatations from middleware');
		res.end('hello from main');
	});

	let uri = listen(app.server);

	// check sub-app first
	axios.get(`${uri}/sub`).then(r => {
		t.is(r.status, 200, '~> received 200 status');
		t.is(r.data, 'hello from sub', '~> received "hello from sub" response');
	}).then(_ => {
		// check main-app now
		axios.get(uri).then(r => {
			t.is(r.status, 200, '~> received 200 status');
			t.is(r.data, 'hello from main', '~> received "hello from main" response');
			app.server.close();
		});
	});
});
