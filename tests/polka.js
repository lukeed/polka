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

test('polka::usage::middleware (basenames)', t => {
	t.plan(40);

	let chk = false;
	let aaa = (req, res, next) => (req.aaa='aaa',next());
	let bbb = (req, res, next) => (req.bbb='bbb',next());
	let bar = (req, res, next) => (req.bar='bar',next());
	let ccc = (req, res, next) => {
		if (chk) { // runs 2x
			t.true(req.url.includes('/foo'), 'defers `bware` URL mutation until after global');
			t.true(req.pathname.includes('/foo'), 'defers `bware` PATH mutation until after global');
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
			t.false(req.pathname.includes('foo'), '~> strips "foo" base from `req.pathname`');
			t.ok(req.originalUrl.includes('foo'), '~> keeps "foo" base within `req.originalUrl`');
			res.end('hello from foo');
		})
		.use('bar', bar, (req, res) => {
			t.pass('runs the base middleware for: bar');
			t.is(req.aaa, 'aaa', '~> runs after `aaa` global middleware');
			t.is(req.bbb, 'bbb', '~> runs after `bbb` global middleware');
			t.is(req.bar, 'bar', '~> runs after `bar` SELF-GROUPED middleware');
			t.false(req.url.includes('bar'), '~> strips "bar" base from `req.url`');
			t.false(req.pathname.includes('bar'), '~> strips "bar" base from `req.pathname`');
			t.ok(req.originalUrl.includes('bar'), '~> keeps "bar" base within `req.originalUrl`');
			t.is(req.pathname, '/hello', '~> matches expected `req.pathname` value');
			res.end('hello from bar');
		})
		.get('/', (req, res) => {
			t.pass('runs the MAIN app handler for GET /');
			t.is(req.aaa, 'aaa', '~> runs after `aaa` global middleware');
			t.is(req.bbb, 'bbb', '~> runs after `bbb` global middleware');
			res.end('hello from main');
		});

	t.is(app.wares.length, 3, 'added 2 global middleware functions');
	let keys = Object.keys(app.bwares);
	t.is(keys.length, 2, 'added 2 basename middleware groups');
	t.deepEqual(keys, ['/foo', '/bar'], '~> has middleware groups for `/foo` & `/bar` path matches');

	let uri = listen(app.server);

	axios.get(uri).then(r => {
		t.is(r.status, 200, '~> received 200 status');
		t.is(r.data, 'hello from main', '~> received "hello from main" response');
	}).then(_ => {
		// Test (GET /foo)
		chk = true;
		axios.get(`${uri}/foo`).then(r => {
			t.is(r.status, 200, '~> received 200 status');
			t.is(r.data, 'hello from foo', '~> received "hello from foo" response');
		}).then(_ => {
			// Test (POST /foo/items?this=123)
			chk = true;
			axios.post(`${uri}/foo/items?this=123`).then(r => {
				t.is(r.status, 200, '~> received 200 status');
				t.is(r.data, 'hello from foo', '~> received "hello from foo" response');
			}).then(_ => {
				// Test (GET /bar/hello)
				axios.get(`${uri}/bar/hello`).then(r => {
					t.is(r.status, 200, '~> received 200 status');
					t.is(r.data, 'hello from bar', '~> received "hello from bar" response');
				}).then(_ => {
					// Test (GET 404)
					axios.get(`${uri}/foobar`).catch(err => {
						let r = err.response;
						t.is(r.status, 404, '~> received 404 status');
						t.is(r.data, 'Not Found', '~> received "Not Found" response');
						app.server.close();
					});
				});
			});
		});
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
		t.is(req.query, 'a=0', '~> parses the sub-application `re.query` value');
		t.is(req.originalUrl, '/sub/hi?a=0', '~> preserves original `req.url` value');
		t.is(req.foo, 'hello', '~> receives mutatations from main-app middleware');
		t.is(req.bar, 'world', '~> receives mutatations from own middleware');
		res.end('hello from sub@show');
	});

	let app = polka().use(foo).use('sub', sub).get('/', (req, res) => {
		t.pass('run the main-application route');
		t.is(req.foo, 'hello', '~> receives mutatations from middleware');
		t.is(req.bar, undefined, '~> does NOT run the sub-application middleware');
		t.is(req.originalUrl, undefined, '~> does not see an `req.originalUrl` key');
		res.end('hello from main');
	});

	let uri = listen(app.server);

	// check sub-app index route
	axios.get(`${uri}/sub`).then(r => {
		t.is(r.status, 200, '~> received 200 status');
		t.is(r.data, 'hello from sub@index', '~> received "hello from sub@index" response');
	}).then(_ => {
		// check main-app now
		axios.get(uri).then(r => {
			t.is(r.status, 200, '~> received 200 status');
			t.is(r.data, 'hello from main', '~> received "hello from main" response');
		}).then(_ => {
			// check sub-app pattern route
			axios.get(`${uri}/sub/hi?a=0`).then(r => {
				t.is(r.status, 200, '~> received 200 status');
				t.is(r.data, 'hello from sub@show', '~> received "hello from sub@show" response');
				app.server.close();
			});
		});
	});
});

test('polka::options::onError', t => {
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

	let uri = listen(app.server);
	axios.get(uri).catch(err => {
		let r = err.response;
		t.is(r.status, 418, '~> response gets the error code');
		t.is(r.data, 'error: boo~!', '~> response gets the formatted error message');
		app.server.close();
	});
});

test('polka::options::onNoMatch', t => {
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

	let uri = listen(app.server);
	axios.post(uri).catch(err => {
		let r = err.response;
		t.is(r.status, 405, '~> response gets the error code');
		t.is(r.data, 'prefer: Method Not Found', '~> response gets the formatted error message');
		app.server.close();
	});
});
