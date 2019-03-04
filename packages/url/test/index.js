const test = require('tape');
const { parse } = require('url');
const fn = require('../');

const keys = ['protocol', 'slashes', 'auth', 'host', 'port', 'hostname', 'hash'];

test.Test.prototype.isObject = function (val, msg) {
	this.is(Object.prototype.toString.call(val), '[object Object]', msg);
};

function fmt(str) {
	let obj = parse(str);
	if (str.indexOf('#') === -1) {
		keys.forEach(k => delete obj[k]);
	}
	return obj;
}

function run(t, url) {
	let req = { url };
	let out = fn(req);

	t.isObject(out);
	t.is(out._raw, url);
	t.isObject(req._parsedUrl);

	delete out._raw;
	t.same(out, fmt(url), '~> matches values from `url.parse` output');

	t.end();
}

test('(url) exports', t => {
	t.is(typeof fn, 'function', 'exports a function');
	t.end();
});

test('(url) basics', t => {
	t.throws(fn, /Cannot read property/, 'throws if no input');
	t.is(fn({}), undefined, 'returns `undefined` for empty object input');

	let obj = { url: '/' };
	let out = fn(obj);
	t.isObject(out, 'returns Object for valid input (`{ url }`)');
	t.is(out._raw, obj.url, '~> `output._raw` matches input URL string');
	t.ok(!!obj._parsedUrl, 'mutates original input with new `_parsedUrl` key');
	t.isObject(obj._parsedUrl, '~> `req._parsedUrl` is an Object');
	t.same(out, obj._parsedUrl, '~> identical to output');
	t.end();
});

test('(url) "/" output', t => {
	run(t, '/');
});

test('(url) "/foo/bar" output', t => {
	run(t, '/foo/bar');
});

test('(url) "/foo/bar?fizz=buzz" output', t => {
	run(t, '/foo/bar?fizz=buzz');
});

test('(url) "/foo/bar?fizz=buzz&hello=world" output', t => {
	run(t, '/foo/bar?fizz=buzz&hello=world');
});

test('(url) "/foo.123" output', t => {
	run(t, '/foo.123');
});

test('(url) recycle', t => {
	let req = { url: '/foo/bar' };
	let out = fn(req);
	out.foobar = 123;

  t.is(out.foobar, 123);
  t.is(out.pathname, '/foo/bar');

  out = fn(req); // 2nd time
	t.is(out.foobar, 123);
	t.is(out.pathname, '/foo/bar');

	t.end();
});

test('(url) rerun if changed', t => {
	let req = { url: '/foo/bar?fizz=buzz' };
	let out = fn(req);
	out.foobar = 123;

  t.is(out.foobar, 123);
  t.is(out.query, 'fizz=buzz');
  t.is(out.pathname, '/foo/bar');

	req.url = '/foo';
  out = fn(req); // 2nd time
	t.is(out.foobar, undefined);
  t.is(out.query, null);
	t.is(out.pathname, '/foo');

	t.end();
});
