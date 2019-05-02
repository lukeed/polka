import test from 'tape';
import { parse } from 'url';
import fn from '../index.mjs';

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

function run(t, url, isDecode) {
	let req = { url };
	let out = fn(req, isDecode);
	let expect = isDecode ? decodeURIComponent(url) : url;

	t.isObject(out);
	t.is(out._raw, expect);
	t.isObject(req._parsedUrl);

	if (isDecode) {
		t.true(req._decoded, '~> (decode) leaves "req._decoded" trace');
		out.query && t.isObject(out.query, '~> (decode) "req.query" is an object');
	} else {
		delete out._raw;
		t.same(out, fmt(url), '~> matches values from `url.parse` output');
	}

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

test('(url) "/f%C3%B8%C3%B8%C3%9F%E2%88%82r" output', t => {
	run(t, '/f%C3%B8%C3%B8%C3%9F%E2%88%82r');
});

test('(url) "/f%C3%B8%C3%B8%C3%9F%E2%88%82r?phone=%2b8675309" output', t => {
	run(t, '/f%C3%B8%C3%B8%C3%9F%E2%88%82r?phone=%2b8675309');
});

test('(url) "/f%C3%B8%C3%B8%C3%9F%E2%88%82r" output :: decode', t => {
	run(t, '/f%C3%B8%C3%B8%C3%9F%E2%88%82r', true);
});

test('(url) "/f%C3%B8%C3%B8%C3%9F%E2%88%82r?phone=%2b8675309" output :: decode', t => {
	run(t, '/f%C3%B8%C3%B8%C3%9F%E2%88%82r?phone=%2b8675309', true);
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

test('(url) repeat query keys', t => {
	let url = '/foo?bar=1&bar=2&bar=3&baz=&bat';

	t.same(fn({ url }).query, 'bar=1&bar=2&bar=3&baz=&bat');
	t.same(fn({ url }, true).query, { bar:['1','2','3'], baz:'', bat:'' });

	t.end();
});

test('(url) decoded', t => {
	let req = { url: '/f%C3%B8%C3%B8%C3%9F%E2%88%82r' };

	let out = fn(req, true);

	t.true(req._decoded);
	t.same(req._parsedUrl, out);
	t.same(out, {
		path: '/føøß∂r',
		pathname: '/føøß∂r',
		href: '/føøß∂r',
		search: null,
		query: null,
		_raw: '/føøß∂r'
	});

	t.end();
});

test('(url) decoded w/ query', t => {
	let req = { url: '/f%C3%B8%C3%B8%C3%9F%E2%88%82r?phone=%2b8675309' };

	let out = fn(req, true);

	t.true(req._decoded);
	t.same(req._parsedUrl, out);
	t.same(out, {
		path: '/føøß∂r?phone=+8675309',
		pathname: '/føøß∂r',
		href: '/føøß∂r?phone=+8675309',
		search: '?phone=+8675309',
		query: { phone: '+8675309' },
		_raw: '/føøß∂r?phone=+8675309'
	});

	t.end();
});
