import { test } from 'uvu';
import * as assert from 'uvu/assert';
import { parse } from 'url';
import fn from '../index';

const keys = ['protocol', 'slashes', 'auth', 'host', 'port', 'hostname', 'hash'];

function isObject(val, msg) {
	assert.is(Object.prototype.toString.call(val), '[object Object]', msg);
}

function fmt(str) {
	let obj = parse(str);
	if (str.indexOf('#') === -1) {
		keys.forEach(k => delete obj[k]);
	}
	return JSON.parse(JSON.stringify(obj));
}

function run(url, isDecode) {
	let req = { url };
	let out = fn(req, isDecode);
	let expect = isDecode ? decodeURIComponent(url) : url;

	isObject(out);
	assert.is(out._raw, expect);
	isObject(req._parsedUrl);

	if (isDecode) {
		assert.is(!!req._decoded, url.includes('%'), '~> (decode) leaves "req._decoded" trace');
		if (out.query) {
			isObject(out.query, '~> (decode) "req.query" is an object');
			assert.equal(out.query, isDecode, '~> (decode) parsed "query" object matches');
		}
	} else {
		delete out._raw;
		assert.equal(out, fmt(url), '~> matches values from `url.parse` output');
	}
}

test('exports', () => {
	assert.type(fn, 'function');
});

test('basics', () => {
	assert.throws(fn, /Cannot read property/, 'throws if no input');
	assert.is(fn({}), undefined, 'returns `undefined` for empty object input');

	let obj = { url: '/' };
	let out = fn(obj);
	isObject(out, 'returns Object for valid input (`{ url }`)');
	assert.is(out._raw, obj.url, '~> `output._raw` matches input URL string');
	assert.ok(!!obj._parsedUrl, 'mutates original input with new `_parsedUrl` key');
	isObject(obj._parsedUrl, '~> `req._parsedUrl` is an Object');
	assert.equal(out, obj._parsedUrl, '~> identical to output');
});

test('parse :: "/"', () => {
	run('/');
});

test('parse :: "/foo/bar"', () => {
	run('/foo/bar');
});

test('parse :: "/foo/bar?fizz=buzz"', () => {
	run('/foo/bar?fizz=buzz');
});

test('parse :: "/foo/bar?fizz=buzz&hello=world"', () => {
	run('/foo/bar?fizz=buzz&hello=world');
});

test('parse :: "/foo.123"', () => {
	run('/foo.123');
});

test('parse :: "/foo?bar"', () => {
	run('/foo?bar');
});

test('parse :: "/foo?q=a?b=c"', () => {
	run('/foo?q=a?b=c');
});

test('parse :: "/foo?q=a?b=c" output ::', () => {
	run('/foo?q=a?b=c', {
		q: 'a?b=c'
	});
});

test('parse :: "/f%C3%B8%C3%B8%C3%9F%E2%88%82r"', () => {
	run('/f%C3%B8%C3%B8%C3%9F%E2%88%82r');
});

test('parse :: "/f%C3%B8%C3%B8%C3%9F%E2%88%82r?phone=%2b8675309"', () => {
	run('/f%C3%B8%C3%B8%C3%9F%E2%88%82r?phone=%2b8675309');
});

test('parse :: "/f%C3%B8%C3%B8%C3%9F%E2%88%82r" output ::', () => {
	run('/f%C3%B8%C3%B8%C3%9F%E2%88%82r', {
		// empty
	});
});

test('parse :: "/f%C3%B8%C3%B8%C3%9F%E2%88%82r?phone=%2b8675309" output ::', () => {
	run('/f%C3%B8%C3%B8%C3%9F%E2%88%82r?phone=%2b8675309', {
		phone: '+8675309'
	});
});

test('(url) recycle', () => {
	let req = { url: '/foo/bar' };
	let out = fn(req);
	out.foobar = 123;

	assert.is(out.foobar, 123);
	assert.is(out.pathname, '/foo/bar');

	out = fn(req); // 2nd time
	assert.is(out.foobar, 123);
	assert.is(out.pathname, '/foo/bar');
});

test('(url) rerun if changed', () => {
	let req = { url: '/foo/bar?fizz=buzz' };
	let out = fn(req);
	out.foobar = 123;

	assert.is(out.foobar, 123);
	assert.is(out.query, 'fizz=buzz');
	assert.is(out.pathname, '/foo/bar');

	req.url = '/foo';
	out = fn(req); // 2nd time
	assert.is(out.foobar, undefined);
	assert.is(out.query, null);
	assert.is(out.pathname, '/foo');
});

test('(url) repeat query keys', () => {
	let url = '/foo?bar=1&bar=2&bar=3&baz=&bat';

	assert.equal(fn({ url }).query, 'bar=1&bar=2&bar=3&baz=&bat');
	assert.equal(fn({ url }, true).query, { bar:['1','2','3'], baz:'', bat:'' });
});

test('(url) decoded', () => {
	let req = { url: '/f%C3%B8%C3%B8%C3%9F%E2%88%82r' };

	let out = fn(req, true);

	assert.is(req._decoded, true);
	assert.equal(req._parsedUrl, out);
	assert.equal(out, {
		path: '/føøß∂r',
		pathname: '/føøß∂r',
		href: '/føøß∂r',
		search: null,
		query: null,
		_raw: '/føøß∂r'
	});
});

test('(url) decoded w/ query', () => {
	let req = { url: '/f%C3%B8%C3%B8%C3%9F%E2%88%82r?phone=%2b8675309' };

	let out = fn(req, true);

	assert.is(req._decoded, true);
	assert.equal(req._parsedUrl, out);
	assert.equal(out, {
		path: '/føøß∂r?phone=+8675309',
		pathname: '/føøß∂r',
		href: '/føøß∂r?phone=+8675309',
		search: '?phone=+8675309',
		query: { phone: '+8675309' },
		_raw: '/føøß∂r?phone=+8675309'
	});
});

test('(url) malformed URI decode', () => {
	let req = { url: '/%2' };

	let out = fn(req, true);

	assert.is(req._decoded, true);
	assert.equal(req._parsedUrl, out);
	assert.equal(out, {
		path: '/%2',
		pathname: '/%2',
		href: '/%2',
		search: null,
		query: null,
		_raw: '/%2'
	});
});

test.run();
