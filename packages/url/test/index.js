import { test } from 'uvu';
import * as assert from 'uvu/assert';
import parse from '../index';

/**
 * @param {string} url
 * @param {boolean} isDecode
 * @param {import('..').ParsedURL} expected
 */
function run(url, isDecode, expected) {
	let title = `url :: "${url}"`;
	if (isDecode) title += ' :: decode';

	test(title, () => {
		let req = /** @type any */ ({ url });
		let output = parse(req, isDecode);

		if (output.query) {
			// convert `null` prototype
			output.query = { ...output.query };
		}

		assert.type(output, 'object');
		if (isDecode) assert.is(req._decoded, true);
		assert.is(req._parsedUrl, output, 'referential match');

		assert.is(output.raw, url);
		assert.equal(output, expected);
	});
}

// ---

test('url :: exports', () => {
	assert.type(parse, 'function');
});

test('url :: invalid inputs', () => {
	assert.throws(parse, /Cannot read property/, 'throws if no input');
	assert.is(
		// @ts-ignore
		parse({ /* empty */ }),
		undefined
	);
});

run('/', false, {
	raw: '/',
	pathname: '/',
	search: '',
	query: undefined,
});

run('/foo/bar', false, {
	raw: '/foo/bar',
	pathname: '/foo/bar',
	search: '',
	query: undefined,
});

run('/foo/bar?fizz=buzz', false, {
	raw: '/foo/bar?fizz=buzz',
	pathname: '/foo/bar',
	search: '?fizz=buzz',
	query: {
		fizz: 'buzz',
	},
});

run('/foo/bar?fizz=buzz&hello=world', false, {
	raw: '/foo/bar?fizz=buzz&hello=world',
	pathname: '/foo/bar',
	search: '?fizz=buzz&hello=world',
	query: {
		fizz: 'buzz',
		hello: 'world',
	},
});

run('/foo.123', false, {
	raw: '/foo.123',
	pathname: '/foo.123',
	search: '',
	query: undefined
});

run('/foo?bar', false, {
	raw: '/foo?bar',
	pathname: '/foo',
	search: '?bar',
	query: {
		bar: ''
	}
});

// query param w/ "?" value
run('/foo?q=a?b=c', false, {
	raw: '/foo?q=a?b=c',
	pathname: '/foo',
	search: '?q=a?b=c',
	query: {
		q: 'a?b=c'
	}
});

// repeated query keys
run('/foo?bar=1&bar=2&bar=3&baz=&bat', false, {
	raw: '/foo?bar=1&bar=2&bar=3&baz=&bat',
	pathname: '/foo',
	search: '?bar=1&bar=2&bar=3&baz=&bat',
	query: {
		bar: ['1', '2', '3'],
		baz: '',
		bat: '',
	}
});

// NOT DECODED
run('/f%C3%B8%C3%B8%C3%9F%E2%88%82r', false, {
	raw: '/f%C3%B8%C3%B8%C3%9F%E2%88%82r',
	pathname: '/f%C3%B8%C3%B8%C3%9F%E2%88%82r',
	search: '',
	query: undefined
});

// DECODED
run('/f%C3%B8%C3%B8%C3%9F%E2%88%82r', true, {
	raw: '/f%C3%B8%C3%B8%C3%9F%E2%88%82r',
	pathname: '/føøß∂r',
	search: '',
	query: undefined
});

run('/f%C3%B8%C3%B8%C3%9F%E2%88%82r?phone=%2b8675309', true, {
	raw: '/f%C3%B8%C3%B8%C3%9F%E2%88%82r?phone=%2b8675309',
	pathname: '/føøß∂r',
	search: '?phone=%2b8675309',
	query: {
		phone: '+8675309'
	}
});

// query param w/ "+" for space
run('/hello?world=a+b', true, {
	raw: '/hello?world=a+b',
	pathname: '/hello',
	search: '?world=a+b',
	query: {
		world: 'a b'
	}
});

let plain = 'https://hi.com/w?v=hello&list=world';
let urlencoded = encodeURIComponent(plain);
run(`/foobar/?href=${urlencoded}`, true, {
	raw: `/foobar/?href=${urlencoded}`,
	pathname: '/foobar/',
	search: `?href=${urlencoded}`,
	query: {
		href: plain
	}
});

test('url :: cache :: hit', () => {
	/** @type any */
	let req = { url: '/foo/bar' };
	let out1 = parse(req);

	// @ts-ignore
	out1.foobar = 123;

	let out2 = parse(req);

	// @ts-ignore
	assert.is(out2.foobar, 123);
	assert.is(out1, out2, 'referential');
});

test('url :: cache :: miss', () => {
	/** @type any */
	let req = { url: '/foo/bar?fizz=buzz' };
	let out1 = parse(req);

	assert.is(req._parsedUrl, out1);

	req.url = '/changed';

	let out2 = parse(req);
	assert.is.not(req._parsedUrl, out1);
	assert.is.not(out1, out2, 'referential');
});

test('url :: decode :: URI malformed', () => {
	/** @type any */
	let req = { url: '/%2?foo=bar' };
	let out = parse(req, true);

	assert.is(req._decoded, true);

	// convert `null` prototype
	out.query = { ...out.query };

	assert.equal(out, {
		raw: '/%2?foo=bar',
		pathname: '/%2',
		search: '?foo=bar',
		query: {
			foo: 'bar'
		}
	});
});

test.run();
