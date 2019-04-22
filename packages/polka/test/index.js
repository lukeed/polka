/* eslint-disable no-console */
const http = require('http');
const { get, send, post } = require('httpie');
const { test, listen } = require('./util');
const polka = require('../');

const sleep = ms => new Promise(r => setTimeout(r, ms));

test('(polka) exports', t => {
	t.isFunction(polka, 'exports a function');
	t.end();
});


test('(polka) internals', t => {
	let app = polka();
	let proto = app.__proto__;

	t.isArray(app.wares, 'app.wares is an array');
	t.isEmpty(app.wares, '~> is empty');

	t.same(app.server, undefined, 'app.server is `undefined` initially');

	t.isFunction(app.parse, 'app.parse is a function');
	t.isFunction(app.handler, 'app.handler is a function');
	t.isFunction(app.onNoMatch, 'app.onNoMatch is a function');
	t.isFunction(app.onError, 'app.onError is a function');

	['use', 'listen', 'handler'].forEach(k => {
		t.isFunction(proto[k], `app.${k} is a prototype method`);
	});

	t.isArray(app.routes, 'app.routes is an Array');
	t.isEmpty(app.routes, '~> is empty');

	['add', 'find'].forEach(k => {
		t.isFunction(proto[k], `app.${k} is inherited prototype (Trouter)`);
	});

	['all', 'get', 'head', 'patch', 'options', 'connect', 'delete', 'trace', 'post', 'put'].forEach(k => {
		t.isFunction(app[k], `app.${k} is inherited method (Trouter)`);
	});

	t.end();
});


test('(polka) listen', t => {
	let app = polka();
	let out = app.listen();
	t.same(out, app, 'returns the Polka instance');
	t.ok(app.server, 'initializes a "server" value');
	t.true(app.server instanceof http.Server, '~> creates `http.Server` instance');
	app.server.close();
	t.end();
});


// TODO: Trouter internals & definitions
test('(polka) basics', t => {
	t.plan(24);

	let num = 0;
	let app = polka();

	let arr = [
		['GET','/', []],
		['POST','/users', []],
		['PUT','/users/:id', ['id']]
	];

	arr.forEach(def => {
		let [method, pattern, keys] = def;
		app.add(method, pattern, () => t.pass(`~> matched ${method} ${pattern} route`));
		let obj = app.routes[num++];
		t.is(app.routes.length, num, 'added a new `app.routes` entry');
		t.isObject(obj, '~> entry is an Object');
		t.isArray(obj.handlers, '~~> entry.handlers is an Array');
		t.isFunction(obj.handlers[0], '~~> entry.handlers items are Functions');
		t.true(obj.pattern instanceof RegExp, '~~> entry.pattern is RegExp');
		t.same(obj.keys, keys, '~~> entry.keys are correct');
		t.is(obj.method, method, '~~> entry.method matches');
	});

	arr.forEach(def => {
		let [meth, patt] = def;
		app.find(meth, patt).handlers.forEach(fn => fn());
	});
});


test('(polka) variadic handlers', async t => {
	t.plan(24);

	function foo(req, res, next) {
		req.foo = req.foo || 0;
		req.foo += 250;
		next();
	}

	function bar(req, res, next) {
		req.bar = req.bar || '';
		req.bar += 'bar';
		next();
	}

	function onError(err, req, res) {
		t.pass('2nd "/err" handler threw error!');
		t.is(err, 'error', '~> receives the "error" message');
		t.is(req.foo, 500, '~> foo() ran twice');
		t.is(req.bar, 'bar', '~> bar() ran once');
		res.statusCode = 400;
		res.end('error');
	}

	function toError(req, res, next) {
		next('error');
	}

	let app = (
		polka({ onError }).use(foo, bar)
			.get('/one', foo, bar, (req, res) => {
				t.pass('3rd "/one" handler');
				t.is(req.foo, 500, '~> foo() ran twice');
				t.is(req.bar, 'barbar', '~> bar() ran twice');
				res.end('one');
			})
			.get('/two', foo, (req, res, next) => {
				t.pass('2nd "/two" handler')
				t.is(req.foo, 500, '~> foo() ran twice');
				t.is(req.bar, 'bar', '~> bar() ran once');
				req.hello = 'world';
				next();
			}, (req, res) => {
				t.pass('3rd "/two" handler')
				t.is(req.hello, 'world', '~> preserves route handler order');
				t.is(req.foo, 500, '~> original `req` object all the way');
				res.end('two');
			})
			.get('/err', foo, toError, (req, res) => {
				t.pass('SHOULD NOT RUN');
				res.end('wut');
			})
	);

	t.is(app.wares.length, 2, 'added 2 middleware');
	t.is(app.routes.length, 3, 'added 3 routes in total');
	t.is(app.find('GET', '/one').handlers.length, 3, '~> has 3 handlers for "GET /one" route');
	t.is(app.find('GET', '/two').handlers.length, 3, '~> has 3 handlers for "GET /two" route');
	t.is(app.find('GET', '/err').handlers.length, 3, '~> has 3 handlers for "GET /err" route');

	let uri = listen(app);
	let r = await get(uri + '/one');
	t.is(r.statusCode, 200, '~> received 200 status');
	t.is(r.data, 'one', '~> received "one" response');

	r = await get(uri + '/two');
	t.is(r.statusCode, 200, '~> received 200 status');
	t.is(r.data, 'two', '~> received "two" response');

	await get(uri + '/err').catch(err => {
		t.is(err.statusCode, 400, '~> received 400 status');
		t.is(err.data, 'error', '~> received "error" response');
	});

	app.server.close();
});


test('(polka) middleware', async t => {
	t.plan(22);

	let app = (
		polka()
			.use((req, res, next) => {
				req.one = 'hello';
				next();
			})
			.use('/', (req, res, next) => {
				req.two = 'world';
				next();
			})
			.use('/about', (req, res) => {
				t.is(req.one, 'hello', '~> sub-mware runs after first global middleware');
				t.is(req.two, 'world', '~> sub-mware runs after second global middleware');
				res.end('About');
			})
			.use('/subgroup', (req, res, next) => {
				req.subgroup = true;
				t.is(req.one, 'hello', '~> sub-mware runs after first global middleware');
				t.is(req.two, 'world', '~> sub-mware runs after second global middleware');
				next();
			})
			.post('/subgroup', (req, res) => {
				t.is(req.subgroup, true, '~~> POST /subgroup ran after its shared middleware');
				res.end('POST /subgroup');
			})
			.get('/subgroup/foo', (req, res) => {
				t.is(req.subgroup, true, '~~> GET /subgroup/foo ran after its shared middleware');
				res.end('GET /subgroup/foo');
			})
			.get('/', (req, res) => {
				t.pass('~> matches the GET(/) route');
				t.is(req.one, 'hello', '~> route handler runs after first middleware');
				t.is(req.two, 'world', '~> route handler runs after both middlewares!');
				res.setHeader('x-type', 'text/foo');
				res.end('Hello');
			})
	);

	t.is(app.wares.length, 2, 'added 2 middleware functions');
	t.is(app.routes.length, 5, 'added 5 routes in total');

	let uri = listen(app);
	console.log('GET /');
	let r = await get(uri);
	t.is(r.statusCode, 200, '~> received 200 status');
	t.is(r.data, 'Hello', '~> received "Hello" response');
	t.is(r.headers['x-type'], 'text/foo', '~> received custom header');

	console.log('GET /about');
	r = await get(uri + '/about');
	t.is(r.statusCode, 200, '~> received 200 status');
	t.is(r.data, 'About', '~> received "About" response');

	console.log('POST /subgroup');
	r = await post(uri + '/subgroup');
	t.is(r.statusCode, 200, '~> received 200 status');
	t.is(r.data, 'POST /subgroup', '~> received "POST /subgroup" response');

	console.log('GET /subgroup/foo');
	r = await get(uri + '/subgroup/foo');
	t.is(r.statusCode, 200, '~> received 200 status');
	t.is(r.data, 'GET /subgroup/foo', '~> received "GET /subgroup/foo" response');

	app.server.close();
});


test('(polka) middleware – async', async t => {
	t.plan(8);

	let app = (
		polka().use(async (req, res, next) => {
			await sleep(10);
			req.foo = 123;
			next();
		}).use((req, res, next) => {
			sleep(1).then(() => { req.bar=456 }).then(next);
		}).get('/', (req, res) => {
			t.pass('~> matches the GET(/) route');
			t.is(req.foo, 123, '~> route handler runs after first middleware');
			t.is(req.bar, 456, '~> route handler runs after both middlewares!');
			res.setHeader('x-type', 'text/foo');
			res.end('Hello');
		})
	);

	t.is(app.wares.length, 2, 'added 2 middleware');
	t.is(app.routes.length, 1, 'added 1 routes in total');

	let uri = listen(app);

	let r = await get(uri);
	t.is(r.statusCode, 200, '~> received 200 status');
	t.is(r.data, 'Hello', '~> received "Hello" response');
	t.is(r.headers['x-type'], 'text/foo', '~> received custom header');

	app.server.close();
});


test('(polka) middleware – sequencing', async t => {
	t.plan(15);

	function foo(req, res, next) {
		t.is(req.val = 1, 1, '~> foo saw 1');
		next();
	}

	function bar(req, res, next) {
		t.is(++req.val, 2, '~> bar saw 2');
		next();
	}

	let app = (
		polka()
			.get('/foo', (req, res) => {
				t.is(req.val, undefined, '~> get("/foo") ran before any mware');
				res.end('foo');
			})
			.use(foo, bar)
			.get('/sub', (req, res) => {
				t.is(++req.val, 3, '~> get("/sub") saw 3');
				res.end('ran=' + req.val);
			})
			.use('/sub', (req, res, next) => {
				t.is(++req.val, 3, '~> use("/sub") saw 3');
				next();
			})
			.post('*', (req, res, next) => {
				t.is(++req.val, 4, '~> post("*") saw 4');
				next();
			})
			.post('/sub', (req, res) => {
				t.is(++req.val, 5, '~> post("/sub") saw 5');
				res.end('ran=' + req.val);
			})
	);

	let uri = listen(app);

	console.log('GET "/sub"');
	let r1 = await get(uri + '/sub');
	t.is(r1.statusCode, 200, '~> received 200 status');
	t.is(r1.data, 'ran=3', '~> received "ran=3" response');

	console.log('POST "/sub"');
	let r2 = await post(uri + '/sub');
	t.is(r2.statusCode, 200, '~> received 200 status');
	t.is(r2.data, 'ran=5', '~> received "ran=5" response');

	console.log('GET "/foo"');
	let r3 = await get(uri + '/foo');
	t.is(r3.statusCode, 200, '~> received 200 status');
	t.is(r3.data, 'foo', '~> received "foo" response');

	app.server.close();
});


test('(polka) middleware – use("foo/bar")', async t => {
	t.plan(12);

	function foo(req, res, next) {
		t.is(req.val = 1, 1, '~> foo saw 1');
		next();
	}

	function bar(req, res, next) {
		t.is(++req.val, 2, '~> bar saw 2');
		next();
	}

	let app = (
		polka()
			.use(foo, bar)
			.get('/api/v1', (req, res) => {
				t.is(++req.val, 3, '~> get("/api/v1") saw 3');
				res.end('ran=' + req.val);
			})
			.use('/api/v1', (req, res, next) => {
				t.is(++req.val, 3, '~> use("/api/v1") saw 3');
				next();
			})
			.post('*', (req, res, next) => {
				t.is(++req.val, 4, '~> post("*") saw 4');
				next();
			})
			.post('/api/v1/hello', (req, res) => {
				t.is(++req.val, 5, '~> post("/api/v1/hello") saw 5');
				res.end('ran=' + req.val);
			})
	);

	let uri = listen(app);

	console.log('GET "/api/v1"');
	let r1 = await get(uri + '/api/v1');
	t.is(r1.statusCode, 200, '~> received 200 status');
	t.is(r1.data, 'ran=3', '~> received "ran=3" response');

	console.log('POST "/api/v1/hello"');
	let r2 = await post(uri + '/api/v1/hello');
	t.is(r2.statusCode, 200, '~> received 200 status');
	t.is(r2.data, 'ran=5', '~> received "ran=5" response');

	app.server.close();
});


test('(polka) middleware – use("foo/:bar")', async t => {
	t.plan(16);

	function foo(req, res, next) {
		t.is(req.val = 1, 1, '~> foo saw 1');
		next();
	}

	function bar(req, res, next) {
		t.is(++req.val, 2, '~> bar saw 2');
		next();
	}

	let app = (
		polka()
			.use(foo, bar)
			.get('/api/:version', (req, res) => {
				t.is(++req.val, 3, '~> get("/api/:version") saw 3');
				t.is(req.params.version, 'v1', '~> req.params.version correct');
				res.end('ran=' + req.val);
			})
			.use('/api/:version', (req, res, next) => {
				t.is(++req.val, 3, '~> use("/api/:version") saw 3');
				t.is(req.params.version, 'v2', '~> req.params.version correct');
				next();
			})
			.post('*', (req, res, next) => {
				t.is(++req.val, 4, '~> post("*") saw 4');
				t.is(req.params.version, 'v2', '~> req.params.version correct');
				next();
			})
			.post('/api/:version/hello', (req, res) => {
				t.is(++req.val, 5, '~> post("/api/:version/hello") saw 5');
				t.is(req.params.version, 'v2', '~> req.params.version correct');
				res.end('ran=' + req.val);
			})
	);

	let uri = listen(app);

	console.log('GET "/api/v1"');
	let r1 = await get(uri + '/api/v1');
	t.is(r1.statusCode, 200, '~> received 200 status');
	t.is(r1.data, 'ran=3', '~> received "ran=3" response');

	console.log('POST "/api/v2/hello"');
	let r2 = await post(uri + '/api/v2/hello');
	t.is(r2.statusCode, 200, '~> received 200 status');
	t.is(r2.data, 'ran=5', '~> received "ran=5" response');

	app.server.close();
});


test('(polka) middleware – originalUrl + mutation', async t => {
	t.plan(43);

	let chk = false;
	let aaa = (req, res, next) => (req.aaa='aaa',next());
	let bbb = (req, res, next) => (req.bbb='bbb',next());
	let bar = (req, res, next) => (req.bar='bar',next());
	let ccc = (req, res, next) => {
		if (chk) { // runs 2x
			t.true(req.url.includes('/foo'), 'defers URL mutation until after global');
			t.true(req.path.includes('/foo'), 'defers PATH mutation until after global');
			chk = false;
		}
		next();
	}

	let app = (
		polka()
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
			})
	);

	t.is(app.wares.length, 3, 'added 3 middleware');
	t.is(app.routes.length, 3, 'added 3 routes in total');
	t.is(app.find('GET', '/foo').handlers.length, 3, '~> has 3 handlers for "GET /foo" route');
	t.is(app.find('POST', '/foo').handlers.length, 3, '~> has 3 handlers for "POST /foo" route');
	t.is(app.find('GET', '/bar').handlers.length, 4, '~> has 4 handlers for "GET /bar" route');
	t.is(app.find('POST', '/bar').handlers.length, 4, '~> has 4 handlers for "POST /bar" route');

	let uri = listen(app);

	console.log('GET /');
	let r1 = await get(uri);
	t.is(r1.statusCode, 200, '~> received 200 status');
	t.is(r1.data, 'hello from main', '~> received "hello from main" response');

	chk = true;
	console.log('GET /foo');
	let r2 = await get(`${uri}/foo`);
	t.is(r2.statusCode, 200, '~> received 200 status');
	t.is(r2.data, 'hello from foo', '~> received "hello from foo" response');

	chk = true;
	console.log('POST /foo/items?this=123');
	let r3 = await post(`${uri}/foo/items?this=123`);
	t.is(r3.statusCode, 200, '~> received 200 status');
	t.is(r3.data, 'hello from foo', '~> received "hello from foo" response');

	console.log('GET /bar/hello');
	let r4 = await get(`${uri}/bar/hello`);
	t.is(r4.statusCode, 200, '~> received 200 status');
	t.is(r4.data, 'hello from bar', '~> received "hello from bar" response');

	console.log('GET /foobar');
	await get(`${uri}/foobar`).catch(err => {
		t.is(err.statusCode, 404, '~> received 404 status');
		t.is(err.data, 'Not Found', '~> received "Not Found" response');
	});

	app.server.close();
});


test('(polka) middleware w/ wildcard', async t => {
	t.plan(29);
	let expect;

	let app = (
		polka()
			.use((req, res, next) => {
				req.foo = 'foo';
				next();
			}) // global
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
			})
	);

	let uri = listen(app);

	console.log('GET /');
	let r1 = await get(uri + (expect = '/'));
	t.is(r1.statusCode, 200, '~> received 200 status');
	t.is(r1.data, 'hello from wildcard', '~> received "hello from wildcard" response');

	console.log('GET /hello');
	let r2 = await get(uri + (expect = '/hello'));
	t.is(r2.statusCode, 200, '~> received 200 status');
	t.is(r2.data, 'hello from wildcard', '~> received "hello from wildcard" response');

	console.log('GET /a/b/c');
	let r3 = await get(uri + (expect = '/a/b/c'));
	t.is(r3.statusCode, 200, '~> received 200 status');
	t.is(r3.data, 'hello from wildcard', '~> received "hello from wildcard" response');

	console.log('GET /bar');
	let r4 = await get(`${uri}/bar`);
	t.is(r4.statusCode, 200, '~> received 200 status');
	t.is(r4.data, 'hello from bar', '~> received "hello from bar" response');

	console.log('GET /bar/extra');
	let r5 = await get(`${uri}/bar/extra`);
	t.is(r5.statusCode, 200, '~> received 200 status');
	t.is(r5.data, 'hello from bar', '~> received "hello from bar" response');

	app.server.close();
});


test('(polka) errors – `new Error()`', async t => {
	t.plan(3);

	let app = (
		polka()
			.use((req, res, next) => {
				val += 1;
				next(new Error('boo'));
			})
			.get('/', (req, res) => {
				val = 0; // wont run
				res.end('OK');
			})
	);

	let val = 41;
	let uri = listen(app);
	await get(uri).catch(err => {
		t.is(val, 42, 'exits before route handler if middleware error');
		t.is(err.data, 'boo', '~> received "boo" text');
		t.is(err.statusCode, 500, '~> received 500 status');
	});

	app.server.close();
});


test('(polka) errors – `next(msg)`', async t => {
	t.plan(3);

	let app = (
		polka()
			.use((req, res, next) => {
				next('boo~!');
			})
			.get('/', (req, res) => {
				val = 123; // wont run
				res.end('OK');
			})
	);

	let val = 42;
	let uri = listen(app);
	await get(uri).catch(err => {
		t.is(val, 42, 'exits without running route handler');
		t.is(err.data, 'boo~!', '~> received "boo~!" text');
		t.is(err.statusCode, 500, '~> received 500 status');
	});

	app.server.close();
});


test('(polka) errors – `throw Error`', async t => {
	t.plan(3);

	let app = (
		polka()
			.use(() => {
				let err = new Error('hello');
				err.code = 418;
				throw err;
			})
			.get('/', (req, res) => {
				val = 123; // wont run
				res.end('OK');
			})
	);

	let val = 42;
	let uri = listen(app);
	await get(uri).catch(err => {
		t.is(val, 42, 'exits without running route handler');
		t.is(err.data, 'hello', '~> received "hello" text');
		t.is(err.statusCode, 418, '~> received 418 status (custom)');
	});

	app.server.close();
});


test('(polka) errors – `throw msg`', async t => {
	t.plan(3);

	let app = (
		polka()
			.use(() => {
				throw 'surprise';
			})
			.get('/', (req, res) => {
				val = 123; // wont run
				res.end('OK');
			})
	);

	let val = 42;
	let uri = listen(app);
	await get(uri).catch(err => {
		t.is(val, 42, 'exits without running route handler');
		t.is(err.data, 'surprise', '~> received "surprise" text');
		t.is(err.statusCode, 500, '~> received 500 status');
	});

	app.server.close();
});


test('(polka) errors – manual `res.end` exit', async t => {
	t.plan(3)

	// early res.end()
	let app = (
		polka()
			.use((req, res) => {
				res.statusCode = 501;
				res.end('oh dear');
			})
			.get('/', (req, res) => {
				val = 123; // wont run
				res.end('OK');
			})
	);

	let val = 42;
	let uri = listen(app);
	await get(uri).catch(err => {
		t.is(val, 42, 'exits without running route handler');
		t.is(err.data, 'oh dear', '~> received "oh dear" (custom) text');
		t.is(err.statusCode, 501, '~> received 501 (custom) status');
	});

	app.server.close();
});


test('(polka) sub-application', async t => {
	t.plan(24);

	function foo(req, res, next) {
		req.foo = 'hello';
		next();
	}

	function bar(req, res, next) {
		t.pass('runs the sub-application middleware'); // runs 2x
		req.bar = 'world';
		next();
	}

	let sub = (
		polka()
			.use(bar)
			.get('/', (req, res) => {
				t.pass('runs the sub-application / route');
				t.is(req.url, '/', '~> trims basepath from `req.url` value');
				t.is(req.originalUrl, '/sub', '~> preserves original `req.url` value');
				t.is(req.foo, 'hello', '~> receives mutatations from main-app middleware');
				t.is(req.bar, 'world', '~> receives mutatations from own middleware');
				res.end('hello from sub@index');
			})
			.get('/:bar', (req, res) => {
				t.pass('runs the sub-application /:id route');
				t.is(req.params.bar, 'hi', '~> parses the sub-application params');
				t.is(req.url, '/hi?a=0', '~> trims basepath from `req.url` value');
				t.same(req.query, {a:'0'}, '~> parses the sub-application `res.query` value');
				t.is(req.originalUrl, '/sub/hi?a=0', '~> preserves original `req.url` value');
				t.is(req.foo, 'hello', '~> receives mutatations from main-app middleware');
				t.is(req.bar, 'world', '~> receives mutatations from own middleware');
				res.end('hello from sub@show');
			})
	);

	let app = (
		polka()
			.use(foo)
			.use('sub', sub)
			.get('/', (req, res) => {
				t.pass('run the main-application route');
				t.is(req.foo, 'hello', '~> receives mutatations from middleware');
				t.is(req.bar, undefined, '~> does NOT run the sub-application middleware');
				t.is(req.originalUrl, '/', '~> always sets `req.originalUrl` key');
				res.end('hello from main');
			})
	);

	let uri = listen(app);

	// check sub-app index route
	console.log('GET /sub');
	let r1 = await get(`${uri}/sub`);
	t.is(r1.statusCode, 200, '~> received 200 status');
	t.is(r1.data, 'hello from sub@index', '~> received "hello from sub@index" response');

	// check main-app now
	console.log('GET /');
	let r2 = await get(uri);
	t.is(r2.statusCode, 200, '~> received 200 status');
	t.is(r2.data, 'hello from main', '~> received "hello from main" response');

	// check sub-app pattern route
	console.log('GET /sub/hi?a=0');
	let r3 = await get(`${uri}/sub/hi?a=0`)
	t.is(r3.statusCode, 200, '~> received 200 status');
	t.is(r3.data, 'hello from sub@show', '~> received "hello from sub@show" response');

	app.server.close();
});


test('(polka) sub-application & middleware', async t => {
	t.plan(19);

	function verify(req, res, next) {
		t.is(req.main, true, '~> VERIFY middleware ran after MAIN');
		req.verify = true;
		next();
	}

	// Construct the "API" sub-application
	const api = polka();

	api.use((req, res, next) => {
		t.is(req.main, true, '~> API middleware ran after MAIN');
		t.is(req.verify, true, '~> API middleware ran after VERIFY');
		req.api = true;
		next();
	});

	api.use('/users', (req, res, next) => {
		t.is(req.main, true, '~> API/users middleware ran after MAIN');
		t.is(req.verify, true, '~> API middleware ran after VERIFY');
		t.is(req.api, true, '~> API/users middleware ran after API');
		req.users = true;
		next();
	});

	api.get('/users/:id', (req, res, next) => {
		t.is(req.main, true, '~> GET API/users/:id #1 ran after MAIN');
		t.is(req.verify, true, '~> API middleware ran after VERIFY');
		t.is(req.api, true, '~> GET API/users/:id #1 ran after API');
		t.is(req.users, true, '~> GET API/users/:id #1 ran after API/users');
		t.is(req.params.id, 'BOB', '~> GET /API/users/:id #1 received the `params.id` value');
		req.userid = true;
		next();
	}, (req, res) => {
		t.is(req.main, true, '~> GET API/users/:id #2 ran after MAIN');
		t.is(req.verify, true, '~> API middleware ran after VERIFY');
		t.is(req.api, true, '~> GET API/users/:id #2 ran after API');
		t.is(req.users, true, '~> GET API/users/:id #2 ran after API/users');
		t.is(req.userid, true, '~> GET API/users/:id #2 ran after GET API/users/:id #1');
		t.is(req.params.id, 'BOB', '~> GET /API/users/:id #2 received the `params.id` value');
		res.end(`Hello, ${req.params.id}`);
	});

	// Construct the main application
	const main = (
		polka()
			.use((req, res, next) => {
				req.main = true;
				next();
			})
			.use('/api', verify, api)
	);

	let uri = listen(main);
	let r = await get(uri + '/api/users/BOB');
	t.is(r.statusCode, 200, '~> received 200 status');
	t.is(r.data, 'Hello, BOB', '~> received "Hello, BOB" response');

	main.server.close();
});


test('(polka) options.server', t => {
	let server = http.createServer();
	let app = polka({ server });
	t.same(app.server, server, '~> store custom server internally as is');

	app.listen();
	t.isFunction(server._events.request, '~> attaches `Polka.handler` to server');

	app.server.close();
	t.end();
});


test('(polka) options.onError', async t => {
	t.plan(3);

	let app = polka().use((req, res, next) => next('Oops!'));
	t.isFunction(app.onError, '~> attaches default `app.onError` handler');

	let uri = listen(app);
	await get(uri).catch(err => {
		t.is(err.statusCode, 500, '~> response gets 500 code (default)');
		t.is(err.data, 'Oops!', '~> response body is "Oops!" string');
	});

	app.server.close();
});


test('(polka) options.onError (err.code)', async t => {
	t.plan(3);

	let foo = new Error('Oops!');
	foo.code = 418;

	let app = polka().use((req, res, next) => next(foo));
	t.isFunction(app.onError, '~> attaches default `app.onError` handler');

	let uri = listen(app);
	await get(uri).catch(err => {
		t.is(err.statusCode, 418, '~> response has 418 code (via "err.code" key)');
		t.is(err.data, 'Oops!', '~> response body is "Oops!" string');
	});

	app.server.close();
});


test('(polka) options.onError (err.status)', async t => {
	t.plan(3);

	let foo = new Error('Oops!');
	foo.status = 418;

	let app = polka().use((req, res, next) => next(foo));
	t.isFunction(app.onError, '~> attaches default `app.onError` handler');

	let uri = listen(app);
	await get(uri).catch(err => {
		t.is(err.statusCode, 418, '~> response has 418 code (via "err.status" key)');
		t.is(err.data, 'Oops!', '~> response body is "Oops!" string');
	});

	app.server.close();
});


test('(polka) options.onError – custom', async t => {
	t.plan(7);

	let foo = new Error('boo~!');
	foo.code = 418;

	function onError(err, req, res, next) {
		t.same(err, foo, '~> receives the `err` object directly as 1st param');
		t.ok(req.url, '~> receives the `req` object as 2nd param');
		t.isFunction(res.end, '~> receives the `res` object as 3rd param');
		t.isFunction(next, '~> receives the `next` function 4th param'); // in case want to skip?
		res.statusCode = err.code;
		res.end('error: ' + err.message);
	}

	let app = polka({ onError }).use((req, res, next) => next(foo));
	t.is(app.onError, onError, 'replaces `app.onError` with the option value');
	let uri = listen(app);

	await get(uri).catch(err => {
		t.is(err.statusCode, 418, '~> response has 418 statusCode');
		t.is(err.data, 'error: boo~!', '~> response body is formatted string');
	});

	app.server.close();
});


test('(polka) options.onNoMatch', async t => {
	t.plan(7);

	let foo = (req, res, next) => {
		t.ok(req.url, '~> receives the `req` object as 1st param');
		t.isFunction(res.end, '~> receives the `res` object as 2nd param');
		t.isFunction(next, '~> receives the `next` function 3rd param'); // in case want to skip?
		res.statusCode = 405;
		res.end('prefer: Method Not Found');
	};

	let app = polka({ onNoMatch:foo }).get('/', () => {});

	t.is(app.onNoMatch, foo, 'replaces `app.onNoMatch` with the option value');
	t.not(app.onError, foo, 'does not affect the `app.onError` handler');

	let uri = listen(app);
	await post(uri).catch(err => {
		t.is(err.statusCode, 405, '~> response gets the error code');
		t.is(err.data, 'prefer: Method Not Found', '~> response gets the formatted error message');
	});

	app.server.close();
});


test('(polka) HEAD', async t => {
	t.plan(21);

	function foo(req, res, next) {
		req.foo = req.foo || 0;
		req.foo += 250;
		next();
	}

	function bar(req, res, next) {
		req.bar = req.bar || '';
		req.bar += 'bar';
		next();
	}

	let app = (
		polka()
			.head('/hello', foo, bar, (req, res) => {
				t.pass('~> inside "HEAD /hello" handler');
				t.is(req.foo, 250, '~> foo() ran once');
				t.is(req.bar, 'bar', '~> bar() ran once');
				res.end('world');
			})
			.head('/posts/*', (req, res, next) => {
				t.pass('~> inside "HEAD /posts/*" handler');
				req.head = true;
				next();
			})
			.get('/posts/:title', foo, bar, (req, res) => {
				t.pass('~> inside GET "/posts/:title" handler');
				if (req.method === 'HEAD') {
					t.is(req.head, true, '~> ran after "HEAD posts/*" handler');
				}
				t.is(req.foo, 250, '~> foo() ran once');
				t.is(req.bar, 'bar', '~> bar() ran once');
				res.end(req.params.title);
			})
	);

	t.is(app.routes.length, 3, 'added 3 routes in total');
	t.is(app.find('HEAD', '/hello').handlers.length, 3, '~> has 3 handlers for "HEAD /hello" route');
	t.is(app.find('GET', '/posts/hello').handlers.length, 3, '~> has 3 handlers for "GET /posts/hello" route');
	t.is(app.find('HEAD', '/posts/hello').handlers.length, 4, '~> has 4 handlers for "HEAD /posts/hello" route');

	let uri = listen(app);

	console.log('HEAD /hello');
	let r = await send('HEAD', uri + '/hello');
	t.is(r.statusCode, 200, '~> received 200 status');
	t.is(r.data, '', '~> received empty response');

	console.log('HEAD /posts/narnia');
	r = await send('HEAD', uri + '/posts/narnia');
	t.is(r.statusCode, 200, '~> received 200 status');
	t.is(r.data, '', '~> received empty response');

	console.log('GET /posts/narnia');
	r = await get(uri + '/posts/narnia');
	t.is(r.statusCode, 200, '~> received 200 status');
	t.is(r.data, 'narnia', '~> received "narnia" response');

	app.server.close();
});


test('(polka) decode url', async t => {
	t.plan(8);

	let sub = (
		polka()
			.get('/:foo', (req, res) => {
				t.pass('~> inside "GET /sub/:foo" handler')
				t.true(req._decoded, '~> marked as decoded');
				t.is(req.path, '/føøß∂r', '~> decoded "path" value');
				t.is(req.url, '/føøß∂r?phone=+8675309', '~> decoded "url" value fully');
				t.is(req.params.foo, 'føøß∂r', '~> decoded "params.foo" segment');
				t.is(req.query.phone, '+8675309', '~~> does NOT decode "req.query" keys twice');
				res.end('done');
			})
	);

	let app = polka().use('/sub', sub);
	let uri = listen(app);

	let r = await get(uri + '/sub/f%C3%B8%C3%B8%C3%9F%E2%88%82r?phone=%2b8675309')
	t.is(r.statusCode, 200, '~> received 200 status');
	t.is(r.data, 'done', '~> received response');
	app.server.close();
});
