/* eslint-disable no-console */
import http from 'http';
import { test } from 'uvu';
import * as assert from 'uvu/assert';
import { get, send, post } from 'httpie';
import polka from '../index.js';
import * as $ from './util/index.js';

const hasNamedGroups = 'groups' in /x/.exec('x');
const sleep = ms => new Promise(r => setTimeout(r, ms));

test('exports', () => {
	$.isFunction(polka, 'exports a function');
});


test('internals', () => {
	let app = polka();
	let proto = app.__proto__;

	assert.equal(app.server, undefined, 'app.server is `undefined` initially');

	$.isFunction(app.parse, 'app.parse is a function');
	$.isFunction(app.handler, 'app.handler is a function');
	$.isFunction(app.onNoMatch, 'app.onNoMatch is a function');
	$.isFunction(app.onError, 'app.onError is a function');

	['use', 'listen', 'handler'].forEach(k => {
		$.isFunction(proto[k], `app.${k} is a prototype method`);
	});

	$.isArray(app.routes, 'app.routes is an Array');
	$.isEmpty(app.routes, '~> is empty');

	['add', 'find'].forEach(k => {
		$.isFunction(proto[k], `app.${k} is inherited prototype (Trouter)`);
	});

	['all', 'get', 'head', 'patch', 'options', 'connect', 'delete', 'trace', 'post', 'put'].forEach(k => {
		$.isFunction(app[k], `app.${k} is inherited method (Trouter)`);
	});

});


test('listen', () => {
	let app = polka();
	let out = app.listen();
	assert.equal(out, app, 'returns the Polka instance');
	assert.ok(app.server, 'initializes a "server" value');
	assert.instance(app.server, http.Server, '~> creates `http.Server` instance');
	app.server.close();
});


// TODO: Trouter internals & definitions
test('basics', () => {
	// t.plan(24);

	let num = 0;
	let app = polka();

	let arr = [
		['GET', '/', []],
		['POST', '/users', []],
		['PUT', '/users/:id', ['id']]
	];

	arr.forEach(def => {
		let [method, pattern, keys] = def;
		app.add(method, pattern, () => assert.ok(`~> matched ${method} ${pattern} route`));
		let obj = app.routes[num++];
		assert.is(app.routes.length, num, 'added a new `app.routes` entry');
		$.isObject(obj, '~> entry is an Object');
		$.isArray(obj.handlers, '~~> entry.handlers is an Array');
		$.isFunction(obj.handlers[0], '~~> entry.handlers items are Functions');
		assert.instance(obj.pattern, RegExp, '~~> entry.pattern is RegExp');
		assert.equal(obj.keys, keys, '~~> entry.keys are correct');
		assert.is(obj.method, method, '~~> entry.method matches');
	});

	arr.forEach(def => {
		let [meth, patt] = def;
		app.find(meth, patt).handlers.forEach(fn => fn());
	});
});


test('variadic handlers', async () => {
	// t.plan(23);

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
		assert.ok('2nd "/err" handler threw error!');
		assert.is(err, 'error', '~> receives the "error" message');
		assert.is(req.foo, 500, '~> foo() ran twice');
		assert.is(req.bar, 'bar', '~> bar() ran once');
		res.statusCode = 400;
		res.end('error');
	}

	function toError(req, res, next) {
		next('error');
	}

	let app = (
		polka({ onError }).use(foo, bar)
			.get('/one', foo, bar, (req, res) => {
				assert.ok('3rd "/one" handler');
				assert.is(req.foo, 500, '~> foo() ran twice');
				assert.is(req.bar, 'barbar', '~> bar() ran twice');
				res.end('one');
			})
			.get('/two', foo, (req, res, next) => {
				assert.ok('2nd "/two" handler')
				assert.is(req.foo, 500, '~> foo() ran twice');
				assert.is(req.bar, 'bar', '~> bar() ran once');
				req.hello = 'world';
				next();
			}, (req, res) => {
				assert.ok('3rd "/two" handler')
				assert.is(req.hello, 'world', '~> preserves route handler order');
				assert.is(req.foo, 500, '~> original `req` object all the way');
				res.end('two');
			})
			.get('/err', foo, toError, (req, res) => {
				assert.ok('SHOULD NOT RUN');
				res.end('wut');
			})
	);

	assert.is(app.routes.length, 4, 'added 3 routes in total'); // use(foo, bar) ~> 1 declaration
	assert.is(app.find('GET', '/one').handlers.length, 5, '~> has 5 handlers for "GET /one" route');
	assert.is(app.find('GET', '/two').handlers.length, 5, '~> has 5 handlers for "GET /two" route');
	assert.is(app.find('GET', '/err').handlers.length, 5, '~> has 5 handlers for "GET /err" route');

	let uri = $.listen(app);
	let r = await get(uri + '/one');
	assert.is(r.statusCode, 200, '~> received 200 status');
	assert.is(r.data, 'one', '~> received "one" response');

	r = await get(uri + '/two');
	assert.is(r.statusCode, 200, '~> received 200 status');
	assert.is(r.data, 'two', '~> received "two" response');

	await get(uri + '/err').catch(err => {
		assert.is(err.statusCode, 400, '~> received 400 status');
		assert.is(err.data, 'error', '~> received "error" response');
	});

	app.server.close();
});


test('middleware', async () => {
	// t.plan(21);

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
				assert.is(req.one, 'hello', '~> sub-mware runs after first global middleware');
				assert.is(req.two, 'world', '~> sub-mware runs after second global middleware');
				res.end('About');
			})
			.use('/subgroup', (req, res, next) => {
				req.subgroup = true;
				assert.is(req.one, 'hello', '~> sub-mware runs after first global middleware');
				assert.is(req.two, 'world', '~> sub-mware runs after second global middleware');
				next();
			})
			.post('/subgroup', (req, res) => {
				assert.is(req.subgroup, true, '~~> POST /subgroup ran after its shared middleware');
				res.end('POST /subgroup');
			})
			.get('/subgroup/foo', (req, res) => {
				assert.is(req.subgroup, true, '~~> GET /subgroup/foo ran after its shared middleware');
				res.end('GET /subgroup/foo');
			})
			.get('/', (req, res) => {
				assert.ok('~> matches the GET(/) route');
				assert.is(req.one, 'hello', '~> route handler runs after first middleware');
				assert.is(req.two, 'world', '~> route handler runs after both middlewares!');
				res.setHeader('x-type', 'text/foo');
				res.end('Hello');
			})
	);

	assert.is(app.routes.length, 7, 'added 7 routes in total');

	let uri = $.listen(app);
	// console.log('GET /');
	let r = await get(uri);
	assert.is(r.statusCode, 200, '~> received 200 status');
	assert.is(r.data, 'Hello', '~> received "Hello" response');
	assert.is(r.headers['x-type'], 'text/foo', '~> received custom header');

	// console.log('GET /about');
	r = await get(uri + '/about');
	assert.is(r.statusCode, 200, '~> received 200 status');
	assert.is(r.data, 'About', '~> received "About" response');

	// console.log('POST /subgroup');
	r = await post(uri + '/subgroup');
	assert.is(r.statusCode, 200, '~> received 200 status');
	assert.is(r.data, 'POST /subgroup', '~> received "POST /subgroup" response');

	// console.log('GET /subgroup/foo');
	r = await get(uri + '/subgroup/foo');
	assert.is(r.statusCode, 200, '~> received 200 status');
	assert.is(r.data, 'GET /subgroup/foo', '~> received "GET /subgroup/foo" response');

	app.server.close();
});


test('middleware – async', async () => {
	// t.plan(7);

	let app = (
		polka().use(async (req, res, next) => {
			await sleep(10);
			req.foo = 123;
			next();
		}).use((req, res, next) => {
			sleep(1).then(() => { req.bar=456 }).then(next);
		}).get('/', (req, res) => {
			assert.ok('~> matches the GET(/) route');
			assert.is(req.foo, 123, '~> route handler runs after first middleware');
			assert.is(req.bar, 456, '~> route handler runs after both middlewares!');
			res.setHeader('x-type', 'text/foo');
			res.end('Hello');
		})
	);

	assert.is(app.routes.length, 3, 'added 3 routes in total');

	let uri = $.listen(app);

	let r = await get(uri);
	assert.is(r.statusCode, 200, '~> received 200 status');
	assert.is(r.data, 'Hello', '~> received "Hello" response');
	assert.is(r.headers['x-type'], 'text/foo', '~> received custom header');

	app.server.close();
});


test('middleware – sequencing', async () => {
	// t.plan(15);

	function foo(req, res, next) {
		assert.is(req.val = 1, 1, '~> foo saw 1');
		next();
	}

	function bar(req, res, next) {
		assert.is(++req.val, 2, '~> bar saw 2');
		next();
	}

	let app = (
		polka()
			.get('/foo', (req, res) => {
				assert.is(req.val, undefined, '~> get("/foo") ran before any mware');
				res.end('foo');
			})
			.use(foo, bar)
			.get('/sub', (req, res) => {
				assert.is(++req.val, 3, '~> get("/sub") saw 3');
				res.end('ran=' + req.val);
			})
			.use('/sub', (req, res, next) => {
				assert.is(++req.val, 3, '~> use("/sub") saw 3');
				next();
			})
			.post('*', (req, res, next) => {
				assert.is(++req.val, 4, '~> post("*") saw 4');
				next();
			})
			.post('/sub', (req, res) => {
				assert.is(++req.val, 5, '~> post("/sub") saw 5');
				res.end('ran=' + req.val);
			})
	);

	let uri = $.listen(app);

	// console.log('GET "/sub"');
	let r1 = await get(uri + '/sub');
	assert.is(r1.statusCode, 200, '~> received 200 status');
	assert.is(r1.data, 'ran=3', '~> received "ran=3" response');

	// console.log('POST "/sub"');
	let r2 = await post(uri + '/sub');
	assert.is(r2.statusCode, 200, '~> received 200 status');
	assert.is(r2.data, 'ran=5', '~> received "ran=5" response');

	// console.log('GET "/foo"');
	let r3 = await get(uri + '/foo');
	assert.is(r3.statusCode, 200, '~> received 200 status');
	assert.is(r3.data, 'foo', '~> received "foo" response');

	app.server.close();
});


test('middleware - use(subapp)', async () => {
	// t.plan(21);

	function foo(req, res, next) {
		assert.is(req.main, true, '~> FOO ran after MAIN');
		req.foo = true;
		next();
	}

	function bar(req, res, next) {
		assert.is(req.main, true, '~> BAR ran after MAIN');
		assert.is(req.foo, true, '~> BAR ran after FOO');
		req.bar = true;
		next();
	}

	const sub = (
		polka()
			.use(foo, bar)
			.use((req, res, next) => {
				assert.is(req.main, true, '~> SUB ran after MAIN');
				assert.is(req.foo, true, '~> SUB ran after FOO');
				assert.is(req.bar, true, '~> SUB ran after BAR');
				req.sub = true;
				next();
			})
			.get('/item', (req, res) => {
				assert.ok('~> HANDLER for sub("/item") ran');
				assert.is(req.main, true, '~> HANDLER ran after MAIN');
				assert.is(req.foo, true, '~> HANDLER ran after FOO');
				assert.is(req.bar, true, '~> HANDLER ran after BAR');
				assert.is(req.sub, true, '~> HANDLER ran after SUB');
				res.end('item');
			})
	);

	// Construct the main application
	const main = (
		polka()
			.use((req, res, next) => {
				req.main = true;
				next();
			})
			.use(sub)
	);

	let uri = $.listen(main);

	// console.log('GET "/item"');
	// `sub` has the "/item" route
	let res = await get(uri + '/item'); // +10
	assert.is(res.statusCode, 200, '~> received 200 status');
	assert.is(res.data, 'item', '~> received "item" response');

	// console.log('GET "/unknown"');
	// 404 from `sub` application, no route
	await get(uri + '/unknown').catch(err => { // +6
		assert.is(err.statusCode, 404, '~> received 404 status');
		assert.is(err.data, 'Not Found', '~> received "Not Found" response');
	});

	main.server.close();
});


test('middleware - use(mware, subapp)', async () => {
	// t.plan(21);

	function foo(req, res, next) {
		assert.is(req.main, true, '~> FOO ran after MAIN');
		req.foo = true;
		next();
	}

	function bar(req, res, next) {
		assert.is(req.main, true, '~> BAR ran after MAIN');
		assert.is(req.foo, true, '~> BAR ran after FOO');
		req.bar = true;
		next();
	}

	const sub = (
		polka()
			.use(bar)
			.use((req, res, next) => {
				assert.is(req.main, true, '~> SUB ran after MAIN');
				assert.is(req.foo, true, '~> SUB ran after FOO');
				assert.is(req.bar, true, '~> SUB ran after BAR');
				req.sub = true;
				next();
			})
			.get('/item', (req, res) => {
				assert.ok('~> HANDLER for sub("/item") ran');
				assert.is(req.main, true, '~> HANDLER ran after MAIN');
				assert.is(req.foo, true, '~> HANDLER ran after FOO');
				assert.is(req.bar, true, '~> HANDLER ran after BAR');
				assert.is(req.sub, true, '~> HANDLER ran after SUB');
				res.end('item');
			})
	);

	// Construct the main application
	const main = (
		polka()
			.use((req, res, next) => {
				req.main = true;
				next();
			})
			.use(foo, sub)
	);

	let uri = $.listen(main);

	// console.log('GET "/item"');
	// `sub` has the "/item" route
	let res = await get(uri + '/item'); // +10
	assert.is(res.statusCode, 200, '~> received 200 status');
	assert.is(res.data, 'item', '~> received "item" response');

	// console.log('GET "/unknown"');
	// 404 from `sub` application, no route
	await get(uri + '/unknown').catch(err => { // +6
		assert.is(err.statusCode, 404, '~> received 404 status');
		assert.is(err.data, 'Not Found', '~> received "Not Found" response');
	});

	main.server.close();
});


test('middleware - use("/", subapp)', async () => {
	// t.plan(21);

	function foo(req, res, next) {
		assert.is(req.main, true, '~> FOO ran after MAIN');
		req.foo = true;
		next();
	}

	function bar(req, res, next) {
		assert.is(req.main, true, '~> BAR ran after MAIN');
		assert.is(req.foo, true, '~> BAR ran after FOO');
		req.bar = true;
		next();
	}

	const sub = (
		polka()
			.use(bar)
			.use((req, res, next) => {
				assert.is(req.main, true, '~> SUB ran after MAIN');
				assert.is(req.foo, true, '~> SUB ran after FOO');
				assert.is(req.bar, true, '~> SUB ran after BAR');
				req.sub = true;
				next();
			})
			.get('/item', (req, res) => {
				assert.ok('~> HANDLER for sub("/item") ran');
				assert.is(req.main, true, '~> HANDLER ran after MAIN');
				assert.is(req.foo, true, '~> HANDLER ran after FOO');
				assert.is(req.bar, true, '~> HANDLER ran after BAR');
				assert.is(req.sub, true, '~> HANDLER ran after SUB');
				res.end('item');
			})
	);

	// Construct the main application
	const main = (
		polka()
			.use((req, res, next) => {
				req.main = true;
				next();
			})
			.use('/', foo, sub)
	);

	let uri = $.listen(main);

	// console.log('GET "/item"');
	// `sub` has the "/item" route
	let res = await get(uri + '/item'); // +10
	assert.is(res.statusCode, 200, '~> received 200 status');
	assert.is(res.data, 'item', '~> received "item" response');

	// console.log('GET "/unknown"');
	// 404 from `sub` application, no route
	await get(uri + '/unknown').catch(err => { // +6
		assert.is(err.statusCode, 404, '~> received 404 status');
		assert.is(err.data, 'Not Found', '~> received "Not Found" response');
	});

	main.server.close();
});


test('middleware – use("foo/bar")', async () => {
	// t.plan(16);

	function foo(req, res, next) {
		assert.is(req.val = 1, 1, '~> foo saw 1');
		next();
	}

	function bar(req, res, next) {
		assert.is(++req.val, 2, '~> bar saw 2');
		next();
	}

	let app = (
		polka()
			.use(foo, bar)
			.get('/api/v1', (req, res) => {
				assert.is(++req.val, 3, '~> get("/api/v1") saw 3');
				assert.is(req.url, '/api/v1', '~> get("/api/v1") had correct url'); // 1
				res.end('ran=' + req.val);
			})
			.use('/api/v1', (req, res, next) => {
				assert.is(++req.val, 3, '~> use("/api/v1") saw 3');
				assert.is(req.url, '/hello', '~> use("/api/v1") had correct url'); // 1
				next();
			})
			.post('*', (req, res, next) => {
				assert.is(++req.val, 4, '~> post("*") saw 4');
				assert.is(req.url, '/api/v1/hello', '~> post("*") had correct url'); //
				next();
			})
			.post('/api/v1/hello', (req, res) => {
				assert.is(++req.val, 5, '~> post("/api/v1/hello") saw 5');
				assert.is(req.url, '/api/v1/hello', '~> post("/api/v1/hello") had correct url');
				res.end('ran=' + req.val);
			})
	);

	let uri = $.listen(app);

	// console.log('GET "/api/v1"');
	let r1 = await get(uri + '/api/v1');
	assert.is(r1.statusCode, 200, '~> received 200 status');
	assert.is(r1.data, 'ran=3', '~> received "ran=3" response');

	// console.log('POST "/api/v1/hello"');
	let r2 = await post(uri + '/api/v1/hello');
	assert.is(r2.statusCode, 200, '~> received 200 status');
	assert.is(r2.data, 'ran=5', '~> received "ran=5" response');

	app.server.close();
});


test('middleware – use("foo/:bar")', async () => {
	// t.plan(20);

	function foo(req, res, next) {
		assert.is(req.val = 1, 1, '~> foo saw 1');
		next();
	}

	function bar(req, res, next) {
		assert.is(++req.val, 2, '~> bar saw 2');
		next();
	}

	let app = (
		polka()
			.use(foo, bar)
			.get('/api/:version', (req, res) => {
				assert.is(++req.val, 3, '~> get("/api/:version") saw 3');
				assert.is(req.url, '/api/v1', '~> get("/api/:version") had correct url'); // 1
				assert.is(req.params.version, 'v1', '~> req.params.version correct');
				res.end('ran=' + req.val);
			})
			.use('/api/:version', (req, res, next) => {
				assert.is(++req.val, 3, '~> use("/api/:version") saw 3');
				assert.is(req.url, '/', '~> use("/api/:version") had correct url'); // 1
				assert.is(req.params.version, 'v2', '~> req.params.version correct');
				next();
			})
			.post('*', (req, res, next) => {
				assert.is(++req.val, 4, '~> post("*") saw 4');
				assert.is(req.url, '/api/v2/hello', '~> post("*") had correct url');
				assert.is(req.params.version, 'v2', '~> req.params.version correct');
				next();
			})
			.post('/api/:version/hello', (req, res) => {
				assert.is(++req.val, 5, '~> post("/api/:version/hello") saw 5');
				assert.is(req.url, '/api/v2/hello', '~> post("/api/:version/hello") had correct url');
				assert.is(req.params.version, 'v2', '~> req.params.version correct');
				res.end('ran=' + req.val);
			})
	);

	let uri = $.listen(app);

	// console.log('GET "/api/v1"');
	let r1 = await get(uri + '/api/v1');
	assert.is(r1.statusCode, 200, '~> received 200 status');
	assert.is(r1.data, 'ran=3', '~> received "ran=3" response');

	// console.log('POST "/api/v2/hello"');
	let r2 = await post(uri + '/api/v2/hello');
	assert.is(r2.statusCode, 200, '~> received 200 status');
	assert.is(r2.data, 'ran=5', '~> received "ran=5" response');

	app.server.close();
});


test('middleware – originalUrl + mutation', async () => {
	// t.plan(42);

	let chk = false;
	let aaa = (req, res, next) => (req.aaa='aaa',next());
	let bbb = (req, res, next) => (req.bbb='bbb',next());
	let bar = (req, res, next) => (req.bar='bar',next());
	let ccc = (req, res, next) => {
		if (chk) { // runs 2x
			assert.ok(req.url.includes('/foo'), 'defers URL mutation until after global');
			assert.ok(req.path.includes('/foo'), 'defers PATH mutation until after global');
			chk = false;
		}
		next();
	}

	let app = (
		polka()
			.use(aaa, bbb, ccc) // globals
			.use('foo', (req, res) => {
				// all runs 2 times
				assert.ok('runs the base middleware for: foo');
				assert.is(req.aaa, 'aaa', '~> runs after `aaa` global middleware');
				assert.is(req.bbb, 'bbb', '~> runs after `bbb` global middleware');
				assert.not(req.url.includes('foo'), '~> strips "foo" base from `req.url`');
				assert.not(req.path.includes('foo'), '~> strips "foo" base from `req.path`');
				assert.ok(req.originalUrl.includes('foo'), '~> keeps "foo" base within `req.originalUrl`');
				res.end('hello from foo');
			})
			.use('bar', bar, (req, res) => {
				assert.ok('runs the base middleware for: bar');
				assert.is(req.aaa, 'aaa', '~> runs after `aaa` global middleware');
				assert.is(req.bbb, 'bbb', '~> runs after `bbb` global middleware');
				assert.is(req.bar, 'bar', '~> runs after `bar` SELF-GROUPED middleware');
				assert.not(req.url.includes('bar'), '~> strips "bar" base from `req.url`');
				assert.not(req.path.includes('bar'), '~> strips "bar" base from `req.path`');
				assert.ok(req.originalUrl.includes('bar'), '~> keeps "bar" base within `req.originalUrl`');
				assert.is(req.path, '/hello', '~> matches expected `req.path` value');
				res.end('hello from bar');
			})
			.get('/', (req, res) => {
				assert.ok('runs the MAIN app handler for GET /');
				assert.is(req.aaa, 'aaa', '~> runs after `aaa` global middleware');
				assert.is(req.bbb, 'bbb', '~> runs after `bbb` global middleware');
				res.end('hello from main');
			})
	);

	assert.is(app.routes.length, 4, 'added 4 routes in total');
	// .use('/any') ~> adds 1 BEFORE & 1 AFTER middleware (prep + cleanup)
	assert.is(app.find('GET', '/foo').handlers.length, 6, '~> has 6 handlers for "GET /foo" route');
	assert.is(app.find('POST', '/foo').handlers.length, 6, '~> has 6 handlers for "POST /foo" route');
	assert.is(app.find('GET', '/bar').handlers.length, 7, '~> has 7 handlers for "GET /bar" route');
	assert.is(app.find('POST', '/bar').handlers.length, 7, '~> has 7 handlers for "POST /bar" route');

	let uri = $.listen(app);

	// console.log('GET /');
	let r1 = await get(uri);
	assert.is(r1.statusCode, 200, '~> received 200 status');
	assert.is(r1.data, 'hello from main', '~> received "hello from main" response');

	chk = true;
	// console.log('GET /foo');
	let r2 = await get(`${uri}/foo`);
	assert.is(r2.statusCode, 200, '~> received 200 status');
	assert.is(r2.data, 'hello from foo', '~> received "hello from foo" response');

	chk = true;
	// console.log('POST /foo/items?this=123');
	let r3 = await post(`${uri}/foo/items?this=123`);
	assert.is(r3.statusCode, 200, '~> received 200 status');
	assert.is(r3.data, 'hello from foo', '~> received "hello from foo" response');

	// console.log('GET /bar/hello');
	let r4 = await get(`${uri}/bar/hello`);
	assert.is(r4.statusCode, 200, '~> received 200 status');
	assert.is(r4.data, 'hello from bar', '~> received "hello from bar" response');

	// console.log('GET /foobar');
	await get(`${uri}/foobar`).catch(err => {
		assert.is(err.statusCode, 404, '~> received 404 status');
		assert.is(err.data, 'Not Found', '~> received "Not Found" response');
	});

	app.server.close();
});


test('middleware only w/ mutation', async () => {
	// t.plan(5);

	let app = (
		polka()
			.use('/foo', (req, rest, next) => {
				assert.is(req.url, '/123', '~> use("/foo") saw truncated url');
				next();
			})
			.use('/foo/:id', (req, res, next) => {
				assert.is(req.url, '/', '~> use("/foo/:id") saw truncated url');
				next();
			})
			.get('/foo/:id', (req, res) => {
				assert.is(req.url, '/foo/123', '~> get("/foo/:id") saw full url');
				res.end(req.url);
			})
	);

	let uri = $.listen(app);

	let res = await get(uri + '/foo/123');
	assert.is(res.statusCode, 200, '~> received 200 status');
	assert.is(res.data, '/foo/123', '~> received "/foo/123" response');
	app.server.close();
});


test('middleware w/ wildcard', async () => {
	// t.plan(29);
	let expect;

	let app = (
		polka()
			.use((req, res, next) => {
				req.foo = 'foo';
				next();
			}) // global
			.use('bar', (req, res) => {
				// runs 2x
				assert.ok('runs the base middleware for: bar');
				assert.is(req.foo, 'foo', '~> runs after `foo` global middleware');
				assert.not(req.url.includes('bar'), '~> strips "bar" base from `req.url`');
				assert.not(req.path.includes('bar'), '~> strips "bar" base from `req.path`');
				assert.ok(req.originalUrl.includes('bar'), '~> keeps "bar" base within `req.originalUrl`');
				res.end('hello from bar');
			})
			.get('*', (req, res) => {
				// runs 3x
				assert.ok('runs the MAIN app handler for GET /*');
				assert.is(req.foo, 'foo', '~> runs after `foo` global middleware');
				assert.is(req.url, expect, '~> receives the full, expected URL');
				res.end('hello from wildcard');
			})
	);

	let uri = $.listen(app);

	// console.log('GET /');
	let r1 = await get(uri + (expect = '/'));
	assert.is(r1.statusCode, 200, '~> received 200 status');
	assert.is(r1.data, 'hello from wildcard', '~> received "hello from wildcard" response');

	// console.log('GET /hello');
	let r2 = await get(uri + (expect = '/hello'));
	assert.is(r2.statusCode, 200, '~> received 200 status');
	assert.is(r2.data, 'hello from wildcard', '~> received "hello from wildcard" response');

	// console.log('GET /a/b/c');
	let r3 = await get(uri + (expect = '/a/b/c'));
	assert.is(r3.statusCode, 200, '~> received 200 status');
	assert.is(r3.data, 'hello from wildcard', '~> received "hello from wildcard" response');

	// console.log('GET /bar');
	let r4 = await get(`${uri}/bar`);
	assert.is(r4.statusCode, 200, '~> received 200 status');
	assert.is(r4.data, 'hello from bar', '~> received "hello from bar" response');

	// console.log('GET /bar/extra');
	let r5 = await get(`${uri}/bar/extra`);
	assert.is(r5.statusCode, 200, '~> received 200 status');
	assert.is(r5.data, 'hello from bar', '~> received "hello from bar" response');

	app.server.close();
});


if (hasNamedGroups) {
	test('RegExp routes', async () => {
		// t.plan(29);

		let app = (
			polka()
				.use(/^\/movies/i, (req, res, next) => {
					req.foo = 'foo';
					assert.ok('runs the /movies/i middleware group');
					assert.is(req.originalUrl, '/movies/1997/titanic', '~> sees correct `originalUrl` value');
					assert.is(req.path, '/1997/titanic', '~> sees correct `path` value');
					next();
				}) // global
				.use(/^\/books[/](?<title>[^/]+)/i, (req, res) => {
					assert.ok('runs the /books/<title>/i middleware group');
					assert.is(req.originalUrl, '/books/narnia/comments?foo', '~> sees correct `originalUrl` value');
					assert.is(req.path, '/comments', '~> sees correct `path` value – REPLACED PATTERN');
					assert.is(req.url, '/comments?foo', '~> sees correct `url` value – REPLACED PATTERN');
					assert.is(req.params.title, 'narnia', '~> receives correct `params.title` value');
					assert.equal({ ...req.query }, { foo: '' }, '~> receives correct `req.query` value');
					res.end('cya~!');
				}) // global
				.use(/^\/songs.*/i, (req, res) => {
					assert.ok('runs the /songs.*/i middleware group');
					assert.is(req.originalUrl, '/songs/foo/bar/baz', '~> sees correct `originalUrl` value');
					assert.is(req.path, '/', '~> sees correct `path` value – REPLACED/MATCHED ALL BCUZ PATTERN');
					assert.is(req.url, '/', '~> sees correct `url` value – REPLACED/MATCHED ALL BCUZ PATTERN');
					res.end('rekt');
				}) // global
				.get(/^\/movies[/](?<year>[0-9]{4})[/](?<title>[^/]+)/i, (req, res) => {
					assert.ok('runs the /movies/<year>/<title> route');
					assert.is(req.foo, 'foo', '~> runs after `foo` global middleware');
					assert.is(req.params.year, '1997', '~> receives correct `params.year` value');
					assert.is(req.params.title, 'titanic', '~> receives correct `params.title` value');
					res.end('bye~!');
				})
				.get(/.*/, (req , res) => {
					assert.ok('runs the wildcard route');
					assert.is.not(req.foo, 'foo', '~> did not run after `foo` global middleware');
					assert.is(req.originalUrl, '/hello-world?foo=bar', '~> sees correct `originalUrl` value');
					assert.is(req.path, '/hello-world', '~> sees correct `path` value');
					res.end('hello from wildcard');
				})
		);

		let uri = $.listen(app);

		// console.log('GET /hello-world?foo=bar');
		let r1 = await get(uri + '/hello-world?foo=bar');
		assert.is(r1.statusCode, 200, '~> received 200 status');
		assert.is(r1.data, 'hello from wildcard', '~> received "hello from wildcard" response');

		// console.log('GET /movies/1997/titanic');
		let r2 = await get(uri + '/movies/1997/titanic');
		assert.is(r2.statusCode, 200, '~> received 200 status');
		assert.is(r2.data, 'bye~!', '~> received "bye~!" response');

		// console.log('GET /books/narnia/comments?foo');
		let r3 = await get(uri + '/books/narnia/comments?foo');
		assert.is(r3.statusCode, 200, '~> received 200 status');
		assert.is(r3.data, 'cya~!', '~> received "cya~!" response');

		// console.log('GET /songs/foo/bar/baz');
		let r4 = await get(uri + '/songs/foo/bar/baz');
		assert.is(r4.statusCode, 200, '~> received 200 status');
		assert.is(r4.data, 'rekt', '~> received "rekt" response');

		app.server.close();
	});
}


test('errors – `new Error()`', async () => {
	// t.plan(3);

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
	let uri = $.listen(app);
	await get(uri).catch(err => {
		assert.is(val, 42, 'exits before route handler if middleware error');
		assert.is(err.data, 'boo', '~> received "boo" text');
		assert.is(err.statusCode, 500, '~> received 500 status');
	});

	app.server.close();
});


test('errors – `next(msg)`', async () => {
	// t.plan(3);

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
	let uri = $.listen(app);
	await get(uri).catch(err => {
		assert.is(val, 42, 'exits without running route handler');
		assert.is(err.data, 'boo~!', '~> received "boo~!" text');
		assert.is(err.statusCode, 500, '~> received 500 status');
	});

	app.server.close();
});


test('errors – `throw Error`', async () => {
	// t.plan(3);

	let app = (
		polka()
			.use(() => {
				let err = new Error('hello');
				err.status = 418;
				throw err;
			})
			.get('/', (req, res) => {
				val = 123; // wont run
				res.end('OK');
			})
	);

	let val = 42;
	let uri = $.listen(app);
	await get(uri).catch(err => {
		assert.is(val, 42, 'exits without running route handler');
		assert.is(err.data, 'hello', '~> received "hello" text');
		assert.is(err.statusCode, 418, '~> received 418 status (custom)');
	});

	app.server.close();
});


test('errors – `throw Error` :: async', async () => {
	let app = (
		polka()
			.use(async () => {
				let err = new Error('hello');
				err.status = 418;
				throw err;
			})
			.get('/', (req, res) => {
				val = 123; // wont run
				res.end('OK');
			})
	);

	let val = 42;
	let uri = $.listen(app);
	await get(uri).catch(err => {
		assert.is(val, 42, 'exits without running route handler');
    assert.is(err.statusCode, 418, '~> received custom status');
		assert.is(err.data, 'hello', '~> received "hello" text');
	});

	app.server.close();
});


test('errors – `throw Error` :: async :: subapp', async () => {
	let sub = polka().use(async () => {
		throw new Error('busted');
	});

	let app = polka().use('/sub', sub, (req, res) => {
		val = 123; // wont run
		res.end('OK');
	});

	let val = 42;
	let uri = $.listen(app);
	await get(uri + '/sub/123').catch(err => {
		assert.is(val, 42, 'exits without running route handler');
    assert.is(err.statusCode, 500, '~> received default status');
		assert.is(err.data, 'busted', '~> received "busted" text');
	});

	app.server.close();
});


test('errors – `throw msg`', async () => {
	// t.plan(3);

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
	let uri = $.listen(app);
	await get(uri).catch(err => {
		assert.is(val, 42, 'exits without running route handler');
		assert.is(err.data, 'surprise', '~> received "surprise" text');
		assert.is(err.statusCode, 500, '~> received 500 status');
	});

	app.server.close();
});


test('errors – manual `res.end` exit', async () => {
	// t.plan(3)

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
	let uri = $.listen(app);
	await get(uri).catch(err => {
		assert.is(val, 42, 'exits without running route handler');
		assert.is(err.data, 'oh dear', '~> received "oh dear" (custom) text');
		assert.is(err.statusCode, 501, '~> received 501 (custom) status');
	});

	app.server.close();
});


test('sub-application', async () => {
	// t.plan(24);

	function foo(req, res, next) {
		req.foo = 'hello';
		next();
	}

	function bar(req, res, next) {
		assert.ok('runs the sub-application middleware'); // runs 2x
		req.bar = 'world';
		next();
	}

	let sub = (
		polka()
			.use(bar)
			.get('/', (req, res) => {
				assert.ok('runs the sub-application / route');
				assert.is(req.url, '/', '~> trims basepath from `req.url` value');
				assert.is(req.originalUrl, '/sub', '~> preserves original `req.url` value');
				assert.is(req.foo, 'hello', '~> receives mutatations from main-app middleware');
				assert.is(req.bar, 'world', '~> receives mutatations from own middleware');
				res.end('hello from sub@index');
			})
			.get('/:bar', (req, res) => {
				assert.ok('runs the sub-application /:id route');
				assert.is(req.params.bar, 'hi', '~> parses the sub-application params');
				assert.is(req.url, '/hi?a=0', '~> trims basepath from `req.url` value');
				assert.equal({ ...req.query }, { a:'0' }, '~> parses the sub-application `res.query` value');
				assert.is(req.originalUrl, '/sub/hi?a=0', '~> preserves original `req.url` value');
				assert.is(req.foo, 'hello', '~> receives mutatations from main-app middleware');
				assert.is(req.bar, 'world', '~> receives mutatations from own middleware');
				res.end('hello from sub@show');
			})
	);

	let app = (
		polka()
			.use(foo)
			.use('sub', sub)
			.get('/', (req, res) => {
				assert.ok('run the main-application route');
				assert.is(req.foo, 'hello', '~> receives mutatations from middleware');
				assert.is(req.bar, undefined, '~> does NOT run the sub-application middleware');
				assert.is(req.originalUrl, '/', '~> always sets `req.originalUrl` key');
				res.end('hello from main');
			})
	);

	let uri = $.listen(app);

	// check sub-app index route
	// console.log('GET /sub');
	let r1 = await get(`${uri}/sub`);
	assert.is(r1.statusCode, 200, '~> received 200 status');
	assert.is(r1.data, 'hello from sub@index', '~> received "hello from sub@index" response');

	// check main-app now
	// console.log('GET /');
	let r2 = await get(uri);
	assert.is(r2.statusCode, 200, '~> received 200 status');
	assert.is(r2.data, 'hello from main', '~> received "hello from main" response');

	// check sub-app pattern route
	// console.log('GET /sub/hi?a=0');
	let r3 = await get(`${uri}/sub/hi?a=0`)
	assert.is(r3.statusCode, 200, '~> received 200 status');
	assert.is(r3.data, 'hello from sub@show', '~> received "hello from sub@show" response');

	app.server.close();
});


test('sub-application w/ query params', async () => {
	// t.plan(12);

	let sub = (
		polka()
			.get('/', (req, res) => {
				assert.ok('runs the sub-application / route');
				assert.is(req.url, '/?foo=bar', '~> trims basepath from `req.url` value');
				assert.is(req.originalUrl, '/sub?foo=bar', '~> preserves original `req.url` value');
				assert.equal({ ...req.query }, { foo: 'bar' }, '~> preserves original `req.query` value');
				res.end('hello from sub@index');
			})
	);

	let app = (
		polka()
			.use('/sub', sub)
			.get('/', (req, res) => {
				assert.ok('run the main-application route');
				assert.is(req.url, '/?foo=123', '~> always sets `req.originalUrl` key');
				assert.is(req.originalUrl, '/?foo=123', '~> always sets `req.originalUrl` key');
				assert.equal({ ...req.query }, { foo: '123' }, '~> sets the `req.query` value');
				res.end('hello from main');
			})
	);

	let uri = $.listen(app);

	// check sub-app index route
	// console.log('GET /sub?foo=bar');
	let r1 = await get(`${uri}/sub?foo=bar`); // +4
	assert.is(r1.statusCode, 200, '~> received 200 status');
	assert.is(r1.data, 'hello from sub@index', '~> received "hello from sub@index" response');

	// check main-app now
	// console.log('GET /?foo=123');
	let r2 = await get(uri + '?foo=123'); // +4
	assert.is(r2.statusCode, 200, '~> received 200 status');
	assert.is(r2.data, 'hello from main', '~> received "hello from main" response');

	app.server.close();
});


test('sub-application & middleware', async () => {
	// t.plan(19);

	function verify(req, res, next) {
		assert.is(req.main, true, '~> VERIFY middleware ran after MAIN');
		req.verify = true;
		next();
	}

	// Construct the "API" sub-application
	const api = polka();

	api.use((req, res, next) => {
		assert.is(req.main, true, '~> API middleware ran after MAIN');
		assert.is(req.verify, true, '~> API middleware ran after VERIFY');
		req.api = true;
		next();
	});

	api.use('/users', (req, res, next) => {
		assert.is(req.main, true, '~> API/users middleware ran after MAIN');
		assert.is(req.verify, true, '~> API middleware ran after VERIFY');
		assert.is(req.api, true, '~> API/users middleware ran after API');
		req.users = true;
		next();
	});

	api.get('/users/:id', (req, res, next) => {
		assert.is(req.main, true, '~> GET API/users/:id #1 ran after MAIN');
		assert.is(req.verify, true, '~> API middleware ran after VERIFY');
		assert.is(req.api, true, '~> GET API/users/:id #1 ran after API');
		assert.is(req.users, true, '~> GET API/users/:id #1 ran after API/users');
		assert.is(req.params.id, 'BOB', '~> GET /API/users/:id #1 received the `params.id` value');
		req.userid = true;
		next();
	}, (req, res) => {
		assert.is(req.main, true, '~> GET API/users/:id #2 ran after MAIN');
		assert.is(req.verify, true, '~> API middleware ran after VERIFY');
		assert.is(req.api, true, '~> GET API/users/:id #2 ran after API');
		assert.is(req.users, true, '~> GET API/users/:id #2 ran after API/users');
		assert.is(req.userid, true, '~> GET API/users/:id #2 ran after GET API/users/:id #1');
		assert.is(req.params.id, 'BOB', '~> GET /API/users/:id #2 received the `params.id` value');
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

	let uri = $.listen(main);
	let r = await get(uri + '/api/users/BOB');
	assert.is(r.statusCode, 200, '~> received 200 status');
	assert.is(r.data, 'Hello, BOB', '~> received "Hello, BOB" response');

	main.server.close();
});


test('options.server', () => {
	let server = http.createServer();
	let app = polka({ server });
	assert.equal(app.server, server, '~> store custom server internally as is');

	app.listen();
	$.isFunction(server._events.request, '~> attaches `Polka.handler` to server');

	app.server.close();
});


test('options.onError', async () => {
	// t.plan(3);

	let app = polka().use((req, res, next) => next('Oops!'));
	$.isFunction(app.onError, '~> attaches default `app.onError` handler');

	let uri = $.listen(app);
	await get(uri).catch(err => {
		assert.is(err.statusCode, 500, '~> response gets 500 code (default)');
		assert.is(err.data, 'Oops!', '~> response body is "Oops!" string');
	});

	app.server.close();
});


test('options.onError (err.status)', async () => {
	// t.plan(3);

	let foo = new Error('Oops!');
	foo.status = 418;

	let app = polka().use((req, res, next) => next(foo));
	$.isFunction(app.onError, '~> attaches default `app.onError` handler');

	let uri = $.listen(app);
	await get(uri).catch(err => {
		assert.is(err.statusCode, 418, '~> response has 418 code (via "err.status" key)');
		assert.is(err.data, 'Oops!', '~> response body is "Oops!" string');
	});

	app.server.close();
});


test('options.onError (err.status) non-numeric', async () => {
	function throws(status) {
		return (r1, f2, next) => {
			let e = Error('Oops');
			e.status = status;
			next(e);
		};
	}

	function check(path, code = 500) {
		return get(path).catch(err => {
			assert.is(err.statusCode, code, '~> response has 500 status code');
			assert.is(err.data, 'Oops', '~> response body is "Oops" string');
		});
	}

	let app = (
		polka()
			.get('/null', throws(null))
			.get('/string', throws('418'))
			.get('/array', throws([1, 2, 3]))
			.get('/undefined', throws(undefined))
			.get('/200', throws(200))
			.get('/101', throws(101))
			.get('/99', throws(99))
			.get('/1', throws(1))
			.get('/0', throws(0))
	);

	try {
		let uri = $.listen(app);

		await check(uri + '/0', 500);
		await check(uri + '/1', 500);
		await check(uri + '/99', 500);

		await check(uri + '/101', 101);
		await check(uri + '/200', 200);

		await check(uri + '/null', 500);
		await check(uri + '/string', 500);
		await check(uri + '/undefined', 500);
		await check(uri + '/array', 500);
	} finally {
		app.server.close();
	}
});


test('options.onError – custom', async () => {
	// t.plan(7);

	let foo = new Error('boo~!');
	foo.status = 418;

	function onError(err, req, res, next) {
		assert.equal(err, foo, '~> receives the `err` object directly as 1st param');
		assert.ok(req.url, '~> receives the `req` object as 2nd param');
		$.isFunction(res.end, '~> receives the `res` object as 3rd param');
		$.isFunction(next, '~> receives the `next` function 4th param'); // in case want to skip?
		res.statusCode = err.status;
		res.end('error: ' + err.message);
	}

	let app = polka({ onError }).use((req, res, next) => next(foo));
	assert.is(app.onError, onError, 'replaces `app.onError` with the option value');
	let uri = $.listen(app);

	await get(uri).catch(err => {
		assert.is(err.statusCode, 418, '~> response has 418 statusCode');
		assert.is(err.data, 'error: boo~!', '~> response body is formatted string');
	});

	app.server.close();
});


test('options.onNoMatch', async () => {
	// t.plan(7);

	let foo = (req, res, next) => {
		assert.ok(req.url, '~> receives the `req` object as 1st param');
		$.isFunction(res.end, '~> receives the `res` object as 2nd param');
		$.isFunction(next, '~> receives the `next` function 3rd param'); // in case want to skip?
		res.statusCode = 405;
		res.end('prefer: Method Not Found');
	};

	let app = polka({ onNoMatch:foo }).get('/', () => {});

	assert.is(app.onNoMatch, foo, 'replaces `app.onNoMatch` with the option value');
	assert.is.not(app.onError, foo, 'does not affect the `app.onError` handler');

	let uri = $.listen(app);
	await post(uri).catch(err => {
		assert.is(err.statusCode, 405, '~> response gets the error code');
		assert.is(err.data, 'prefer: Method Not Found', '~> response gets the formatted error message');
	});

	app.server.close();
});


test('HEAD', async () => {
	// t.plan(21);

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
				assert.ok('~> inside "HEAD /hello" handler');
				assert.is(req.foo, 250, '~> foo() ran once');
				assert.is(req.bar, 'bar', '~> bar() ran once');
				res.end('world');
			})
			.head('/posts/*', (req, res, next) => {
				assert.ok('~> inside "HEAD /posts/*" handler');
				req.head = true;
				next();
			})
			.get('/posts/:title', foo, bar, (req, res) => {
				assert.ok('~> inside GET "/posts/:title" handler');
				if (req.method === 'HEAD') {
					assert.is(req.head, true, '~> ran after "HEAD posts/*" handler');
				}
				assert.is(req.foo, 250, '~> foo() ran once');
				assert.is(req.bar, 'bar', '~> bar() ran once');
				res.end(req.params.title);
			})
	);

	assert.is(app.routes.length, 3, 'added 3 routes in total');
	assert.is(app.find('HEAD', '/hello').handlers.length, 3, '~> has 3 handlers for "HEAD /hello" route');
	assert.is(app.find('GET', '/posts/hello').handlers.length, 3, '~> has 3 handlers for "GET /posts/hello" route');
	assert.is(app.find('HEAD', '/posts/hello').handlers.length, 4, '~> has 4 handlers for "HEAD /posts/hello" route');

	let uri = $.listen(app);

	// console.log('HEAD /hello');
	let r = await send('HEAD', uri + '/hello');
	assert.is(r.statusCode, 200, '~> received 200 status');
	assert.is(r.data, '', '~> received empty response');

	// console.log('HEAD /posts/narnia');
	r = await send('HEAD', uri + '/posts/narnia');
	assert.is(r.statusCode, 200, '~> received 200 status');
	assert.is(r.data, '', '~> received empty response');

	// console.log('GET /posts/narnia');
	r = await get(uri + '/posts/narnia');
	assert.is(r.statusCode, 200, '~> received 200 status');
	assert.is(r.data, 'narnia', '~> received "narnia" response');

	app.server.close();
});


test('encoded url', async () => {
	// t.plan(8);

	let sub = (
		polka()
			.get('/:foo', (req, res) => {
				assert.ok('~> inside "GET /sub/:foo" handler')
				assert.ok(!req._decoded, '~> not marked as decoded');
				assert.is(req.path, '/f%C3%B8%C3%B8%C3%9F%E2%88%82r', '~> "path" value');
				assert.is(req.url, '/f%C3%B8%C3%B8%C3%9F%E2%88%82r?phone=%2b8675309', '~> "url" value');
				assert.is(req.params.foo, 'føøß∂r', '~> decoded "params.foo" segment');
				assert.is(req.query.phone, '+8675309', '~~> does NOT decode "req.query" keys twice');
				res.end('done');
			})
	);

	let app = polka().use('/sub', sub);
	let uri = $.listen(app);

	let r = await get(uri + '/sub/f%C3%B8%C3%B8%C3%9F%E2%88%82r?phone=%2b8675309')
	assert.is(r.statusCode, 200, '~> received 200 status');
	assert.is(r.data, 'done', '~> received response');
	app.server.close();
});


test.run();
