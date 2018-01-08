const { test, Test } = require('tape');
const polka = require('../lib');

const $ = Test.prototype;
const METHODS = ['GET', 'POST', 'PUT', 'DELETE'];

$.isEmpty = function (val, msg) {
	this.ok(!Object.keys(val).length, msg);
};

$.isArray = function (val, msg) {
	this.ok(Array.isArray(val), msg);
}

$.isObject = function (val, msg) {
	this.ok(Boolean(val) && (val.constructor === Object), msg);
}

$.isFunction = function (val, msg) {
	this.is(typeof val, 'function', msg);
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

	t.is(app.server.constructor.name, 'Server', 'app.server is an HTTP server');

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
	t.plan(4);

	let app = polka().use((req, res, next) => {
		(req.one='hello') && next();
	}).use((req, res, next) => {
		(req.two='world') && next();
	}).get('/', (req, res) => {
		t.pass('~> matches the GET(/) route');
		t.is(req.one, 'hello', '~> route handler runs after first middleware');
		t.is(req.two, 'world', '~> route handler runs after both middlewares!');
	});

	t.is(app.wares.length, 2, 'added 2 middleware functions');

	app.handler({ method:'GET', url:'/' });
});
