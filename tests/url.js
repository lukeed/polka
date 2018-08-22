const { parse } = require('url');
const { test } = require('./util');
const fn = require('../packages/url');

const keys = ['protocol', 'slashes', 'auth', 'host', 'port', 'hostname', 'hash'];

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

test('polka/url', t => {
	t.is(typeof fn, 'function', 'exports a function');
	t.end();
});

test('polka/url :: usage', t => {
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

test('polka/url :: /', t => {
	run(t, '/');
});

test('polka/url :: /foo/bar', t => {
	run(t, '/foo/bar');
});

test('polka/url :: /foo/bar?fizz=buzz', t => {
	run(t, '/foo/bar?fizz=buzz');
});

test('polka/url :: /foo/bar?fizz=buzz&hello=world', t => {
	run(t, '/foo/bar?fizz=buzz&hello=world');
});

test('polka/url :: /foo/bar?fizz=buzz&hello=world#testing', t => {
	run(t, '/foo/bar?fizz=buzz&hello=world#testing');
});

test('polka/url :: /foo.123#hello', t => {
	run(t, '/foo.123#hello');
});

test('polka/url :: recycle', t => {
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

test('polka/url :: rerun if changed', t => {
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
