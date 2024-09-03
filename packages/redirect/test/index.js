import { test } from 'uvu';
import * as assert from 'uvu/assert';
import fn from '../index.js';

function isRedirect(arr, code=302) {
	let [starting, next, result] = arr;
	let res = Response(starting);
	fn(res, code, next);

	// console.log(`"${starting}" + "${next}" = "${result}" (${code})`);
	assert.is(res.statusCode, code, `~> sets statusCode`);
	assert.is(res.body, '', '~> sets empty "res.body" content');
	assert.is(res.headers['Content-Length'], 0, '~> sets "Content-Length" header');
	assert.is(res.headers['Location'], result, `~> sets "Location" header`);
}

function Response(originalUrl, referrer='') {
	let res = {
		body: '',
		headers: {},
		statusCode: 200,
		socket: {
			parser: {
				incoming: {
					originalUrl,
					headers: { referrer }
				}
			}
		},
		writeHead(code, obj={}) {
			res.statusCode = code;
			Object.assign(res.headers, obj);
		},
		end(str='') {
			res.body = str;
			res.finished = true;
		}
	};
	return res;
}

test('exports', () => {
	assert.type(fn, 'function');
});

test('defaults', () => {
	let res = Response('/foo/bar/baz');
	fn(res);
	assert.is(res.statusCode, 302, '~> uses 302 statusCode (default)');
	assert.is(res.headers['Location'], '', '~> sets "Location" as empty (default)');
});

test('location only', () => {
	let res = Response('/foo/bar/baz');
	// @ts-ignore -- TODO: types
	fn(res, '/users/123');
	assert.is(res.statusCode, 302, '~> uses 302 statusCode (default)');
	assert.is(res.headers['Location'], '/users/123', '~> sets "Location" header correctly');
});

test('statusCode and location', () => {
	let res = Response('/foo/bar/baz');
	fn(res, 301, '/users/123');
	assert.is(res.statusCode, 301, '~> uses 301 statusCode (default)');
	assert.is(res.headers['Location'], '/users/123', '~> sets "Location" header correctly');
});

test('"back" ', () => {
	let res = Response('/foo/bar/baz');

	// @ts-ignore -- TODO: types
	fn(res, 'back');
	assert.is(res.statusCode, 302, '~> uses 302 statusCode (default)');
	assert.is(res.headers['Location'], '/', '~> uses "/" Location (default)');

	fn(res, 301, 'back');
	assert.is(res.statusCode, 301, '~> uses 301 statusCode (custom)');
	assert.is(res.headers['Location'], '/', '~> uses "/" Location (default)');
});

test('"back" w/ Referrer', () => {
	let res = Response('/foo/bar/baz', '/users/123');

	// @ts-ignore -- TODO: types
	fn(res, 'back');
	assert.is(res.statusCode, 302, '~> uses 302 statusCode (default)');
	assert.is(res.headers['Location'], '/users/123', '~> uses "/users/123" Location ("Referrer")');

	fn(res, 301, 'back');
	assert.is(res.statusCode, 301, '~> uses 301 statusCode (custom)');
	assert.is(res.headers['Location'], '/users/123', '~> uses "/users/123" Location ("Referrer")');
});

test('values – relatives', () => {
	[
		['/foo/bar', '/', '/'],
		['/foo/bar', './', '/foo/'],
		['/foo/bar/', './', '/foo/bar/'],
		['/foo/bar/', 'baz', '/foo/bar/baz'],
		['/foo/bar', 'baz', '/foo/baz'],
		['/foo/bar/', '../', '/foo/'],
		['/foo/bar', '../', '/'],
	].forEach(arr => {
		isRedirect(arr, 302);
	});
});

test('redirect values', () => {
	[
		['/foo/bar', '/', '/'],
		['/foo/bar', './', '/foo/'],
		['/foo/bar/', './', '/foo/bar/'],
		['/foo/bar', 'http://example.com', 'http://example.com/'],
		['/foo/bar/', 'http://example.com/foo', 'http://example.com/foo'],
		['/foo/bar/', 'baz/bat', '/foo/bar/baz/bat'],
		['/foo/bar', 'baz/bat', '/foo/baz/bat'],
		['/foo/bar/', 'baz', '/foo/bar/baz'],
		['/foo/bar', 'baz', '/foo/baz'],
		['/foo/bar/', '../', '/foo/'],
		['/foo/bar', '../', '/'],
	].forEach(arr => {
		isRedirect(arr, 302);
	});
});

test.run();
