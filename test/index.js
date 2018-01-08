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

	t.isObject(app.opts, 'opts is an object');
	t.isEmpty(app.opts, 'opts is empty');

	t.isArray(app.wares, 'wares is an array');
	t.isEmpty(app.wares, 'wares is empty');

	t.is(app.server.constructor.name, 'Server', 'server is an HTTP server');

	['parse', 'listen', 'handler'].forEach(k => {
		t.isFunction(app[k], `${k} is a function`);
	});

	t.isObject(app.routes, 'routes is an object tree');
	t.isObject(app.handlers, 'handlers is an object tree');

	METHODS.forEach(k => {
		t.isArray(app.routes[k], `~> routes.${k} is an object`);
		t.isEmpty(app.routes[k], `~> routes.${k} is empty`);
		t.isObject(app.handlers[k], `~> handlers.${k} is an object`);
		t.isEmpty(app.handlers[k], `~> handlers.${k} is empty`);
	});

	t.end();
});
