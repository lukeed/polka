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

	t.is(app.server, undefined, 'app.server is undefined by default (pre-listen)');

	t.isFunction(app.onError, 'app.onError is a function');
	t.isFunction(app.onNoMatch, 'app.onNoMatch is a function');

	['parse', 'handler'].forEach(k => {
		t.isFunction(app[k], `app.${k} is a function`);
	});

	['use', 'listen', 'handler'].forEach(k => {
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

test('polka::usage::middleware', async t => {
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

	let uri = await listen(app);
	let r = await axios.get(uri);
	t.is(r.status, 200, '~> received 200 status');
	t.is(r.data, 'Hello', '~> received "Hello" response');
	t.is(r.headers['x-type'], 'text/foo', '~> received custom header');
	app.server.close();
});

test('polka::usage::middleware (async)', async t => {
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

	let uri = await listen(app);

	let r = await axios.get(uri);
	t.is(r.status, 200, '~> received 200 status');
	t.is(r.data, 'Hello', '~> received "Hello" response');
	t.is(r.headers['x-type'], 'text/foo', '~> received custom header');

	app.server.close();
});

test('polka::usage::middleware (basenames)', async t => {
	t.plan(40);

	let chk = false;
	let aaa = (req, res, next) => (req.aaa='aaa',next());
	let bbb = (req, res, next) => (req.bbb='bbb',next());
	let bar = (req, res, next) => (req.bar='bar',next());
	let ccc = (req, res, next) => {
		if (chk) { // runs 2x
			t.true(req.url.includes('/foo'), 'defers `bware` URL mutation until after global');
			t.true(req.path.includes('/foo'), 'defers `bware` PATH mutation until after global');
			chk = false;
		}
		next();
	}

	let app = polka()
		.use(aaa, bbb, ccc) // globals
		.use('foo', (req, res) => {
			// all runs 2 times
			t.pass('runs the base middleware for: foo');
			t.is(req.aaa, 'aaa', '~> runs after `aaa` global middleware');
			t.is(req.bbb, 'bbb', '~> runs after `bbb` global middleware');
			t.false(req.url.includes('foo'), '~> strips "foo" base from `req.url`');
			t.false(req.path.includes('foo'), '~> strips "foo" base from `req.path`');
			t.ok(req.originalUrl.includes('foo'), '~> keeps "foo" base within `req.originalUrl`');
			res.end('hello from foo');
		})
		.use('bar', bar, (req, res) => {
			t.pass('runs the base middleware for: bar');
			t.is(req.aaa, 'aaa', '~> runs after `aaa` global middleware');
			t.is(req.bbb, 'bbb', '~> runs after `bbb` global middleware');
			t.is(req.bar, 'bar', '~> runs after `bar` SELF-GROUPED middleware');
			t.false(req.url.includes('bar'), '~> strips "bar" base from `req.url`');
			t.false(req.path.includes('bar'), '~> strips "bar" base from `req.path`');
			t.ok(req.originalUrl.includes('bar'), '~> keeps "bar" base within `req.originalUrl`');
			t.is(req.path, '/hello', '~> matches expected `req.path` value');
			res.end('hello from bar');
		})
		.get('/', (req, res) => {
			t.pass('runs the MAIN app handler for GET /');
			t.is(req.aaa, 'aaa', '~> runs after `aaa` global middleware');
			t.is(req.bbb, 'bbb', '~> runs after `bbb` global middleware');
			res.end('hello from main');
		});

	t.is(app.wares.length, 3, 'added 3 global middleware functions');
	let keys = Object.keys(app.bwares);
	t.is(keys.length, 2, 'added 2 basename middleware groups');
	t.deepEqual(keys, ['/foo', '/bar'], '~> has middleware groups for `/foo` & `/bar` path matches');

	let uri = await listen(app);

	let r1 = await axios.get(uri);
	t.is(r1.status, 200, '~> received 200 status');
	t.is(r1.data, 'hello from main', '~> received "hello from main" response');

	// Test (GET /foo)
	chk = true;
	let r2 = await axios.get(`${uri}/foo`);
	t.is(r2.status, 200, '~> received 200 status');
	t.is(r2.data, 'hello from foo', '~> received "hello from foo" response');

	// Test (POST /foo/items?this=123)
	chk = true;
	let r3 = await axios.post(`${uri}/foo/items?this=123`);
	t.is(r3.status, 200, '~> received 200 status');
	t.is(r3.data, 'hello from foo', '~> received "hello from foo" response');

	// Test (GET /bar/hello)
	let r4 = await axios.get(`${uri}/bar/hello`);
	t.is(r4.status, 200, '~> received 200 status');
	t.is(r4.data, 'hello from bar', '~> received "hello from bar" response');

	// Test (GET 404)
	await axios.get(`${uri}/foobar`).catch(err => {
		let r = err.response;
		t.is(r.status, 404, '~> received 404 status');
		t.is(r.data, 'Not Found', '~> received "Not Found" response');
	});

	app.server.close();
});

test('polka::usage::middleware (wildcard)', async t => {
	t.plan(29);

	let expect;
	let foo = (req, res, next) => (req.foo='foo',next());

	let app = polka()
		.use(foo) // global
		.use('bar', (req, res) => {
			// runs 2x
			t.pass('runs the base middleware for: bar');
			t.is(req.foo, 'foo', '~> runs after `foo` global middleware');
			t.false(req.url.includes('bar'), '~> strips "bar" base from `req.url`');
			t.false(req.path.includes('bar'), '~> strips "bar" base from `req.path`');
			t.ok(req.originalUrl.includes('bar'), '~> keeps "bar" base within `req.originalUrl`');
			res.end('hello from bar');
		})
		.get('*', (req, res) => {
			// runs 3x
			t.pass('runs the MAIN app handler for GET /*');
			t.is(req.foo, 'foo', '~> runs after `foo` global middleware');
			t.is(req.url, expect, '~> receives the full, expected URL');
			res.end('hello from wildcard');
		});

	let uri = await listen(app);

	expect = '/';
	let r1 = await axios.get(uri);
	t.is(r1.status, 200, '~> received 200 status');
	t.is(r1.data, 'hello from wildcard', '~> received "hello from wildcard" response');

	expect = '/hello';
	let r2 = await axios.get(`${uri}${expect}`);
	t.is(r2.status, 200, '~> received 200 status');
	t.is(r2.data, 'hello from wildcard', '~> received "hello from wildcard" response');

	expect = '/a/b/c';
	let r3 = await axios.get(`${uri}${expect}`);
	t.is(r3.status, 200, '~> received 200 status');
	t.is(r3.data, 'hello from wildcard', '~> received "hello from wildcard" response');

	let r4 = await axios.get(`${uri}/bar`);
	t.is(r4.status, 200, '~> received 200 status');
	t.is(r4.data, 'hello from bar', '~> received "hello from bar" response');

	let r5 = await axios.get(`${uri}/bar/extra`);
	t.is(r5.status, 200, '~> received 200 status');
	t.is(r5.data, 'hello from bar', '~> received "hello from bar" response');

	app.server.close();
});

test('polka::usage::errors', async t => {
	t.plan(9);
	let a = 41;

	// next(Error)
	let foo = polka().use((req, res, next) => {
		(a += 1) && next(new Error('boo'));
	}).get('/', (req, res) => {
		a = 0; // wont run
		res.end('OK');
	});

	let u1 = await listen(foo);
	await axios.get(u1).catch(err => {
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

	let u2 = await listen(bar);
	await axios.get(u2).catch(err => {
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

	let u3 = await listen(baz);
	await axios.get(u3).catch(err => {
		let r = err.response;
		t.is(a, 42, 'exits without running route handler');
		t.is(r.data, 'oh dear', '~> received "oh dear" (custom) text');
		t.is(r.status, 501, '~> received 501 (custom) status');
		baz.server.close();
	});
});

test('polka::usage::sub-apps', async t => {
	t.plan(24);

	let foo = (req, res, next) => {
		req.foo = 'hello';
		next();
	};

	let bar = (req, res, next) => {
		t.pass('runs the sub-application middleware'); // runs 2x
		req.bar = 'world';
		next();
	};

	let sub = polka().use(bar).get('/', (req, res) => {
		t.pass('runs the sub-application / route');
		t.is(req.url, '/', '~> trims basepath from `req.url` value');
		t.is(req.originalUrl, '/sub', '~> preserves original `req.url` value');
		t.is(req.foo, 'hello', '~> receives mutatations from main-app middleware');
		t.is(req.bar, 'world', '~> receives mutatations from own middleware');
		res.end('hello from sub@index');
	}).get('/:bar', (req, res) => {
		t.pass('runs the sub-application /:id route');
		t.is(req.params.bar, 'hi', '~> parses the sub-application params');
		t.is(req.url, '/hi?a=0', '~> trims basepath from `req.url` value');
		t.same(req.query, {a:'0'}, '~> parses the sub-application `res.query` value');
		t.is(req.originalUrl, '/sub/hi?a=0', '~> preserves original `req.url` value');
		t.is(req.foo, 'hello', '~> receives mutatations from main-app middleware');
		t.is(req.bar, 'world', '~> receives mutatations from own middleware');
		res.end('hello from sub@show');
	});

	let app = polka().use(foo).use('sub', sub).get('/', (req, res) => {
		t.pass('run the main-application route');
		t.is(req.foo, 'hello', '~> receives mutatations from middleware');
		t.is(req.bar, undefined, '~> does NOT run the sub-application middleware');
		t.is(req.originalUrl, '/', '~> always sets `req.originalUrl` key');
		res.end('hello from main');
	});

	let uri = await listen(app);

	// check sub-app index route
	let r1 = await axios.get(`${uri}/sub`);
	t.is(r1.status, 200, '~> received 200 status');
	t.is(r1.data, 'hello from sub@index', '~> received "hello from sub@index" response');

	// check main-app now
	let r2 = await axios.get(uri);
	t.is(r2.status, 200, '~> received 200 status');
	t.is(r2.data, 'hello from main', '~> received "hello from main" response');

	// check sub-app pattern route
	let r3 = await axios.get(`${uri}/sub/hi?a=0`)
	t.is(r3.status, 200, '~> received 200 status');
	t.is(r3.data, 'hello from sub@show', '~> received "hello from sub@show" response');

	app.server.close();
});

test('polka::options::onError', async t => {
	t.plan(7);

	let abc = new Error('boo~!');
	abc.code = 418; // teapot lol

	let foo = (err, req, res, next) => {
		t.is(err, abc, '~> receives the `err` object directly as 1st param');
		t.ok(req.url, '~> receives the `req` object as 2nd param');
		t.isFunction(res.end, '~> receives the `res` object as 3rd param');
		t.isFunction(next, '~> receives the `next` function 4th param'); // in case want to skip?
		res.statusCode = err.code;
		res.end('error: ' + err.message);
	};

	let app = polka({ onError:foo }).use((req, res, next) => next(abc));

	t.is(app.onError, foo, 'replaces `app.onError` with the option value');

	let uri = await listen(app);
	await axios.get(uri).catch(err => {
		let r = err.response;
		t.is(r.status, 418, '~> response gets the error code');
		t.is(r.data, 'error: boo~!', '~> response gets the formatted error message');
		app.server.close();
	});
});

test('polka::options::onNoMatch', async t => {
	t.plan(6);

	let foo = (req, res) => {
		t.ok(req.url, '~> receives the `req` object as 1st param');
		t.isFunction(res.end, '~> receives the `res` object as 2nd param');
		res.statusCode = 405;
		res.end('prefer: Method Not Found');
	};

	let app = polka({ onNoMatch:foo }).get('/', _ => {});

	t.is(app.onNoMatch, foo, 'replaces `app.onNoMatch` with the option value');
	t.not(app.onError, foo, 'does not affect the `app.onError` handler');

	let uri = await listen(app);
	await axios.post(uri).catch(err => {
		let r = err.response;
		t.is(r.status, 405, '~> response gets the error code');
		t.is(r.data, 'prefer: Method Not Found', '~> response gets the formatted error message');
		app.server.close();
	});
});
