import test from 'tape';
import fn from '../index';

test.Test.prototype.isRedirect = function (arr, code=302) {
	let [starting, next, result] = arr;
	let res = Response(starting);
	fn(res, code, next);

	console.log(`"${starting}" + "${next}" = "${result}" (${code})`);
	this.is(res.statusCode, code, `~> sets statusCode`);
	this.is(res.body, '', '~> sets empty "res.body" content');
	this.is(res.headers['Content-Length'], 0, '~> sets "Content-Length" header');
	this.is(res.headers['Location'], result, `~> sets "Location" header`);
};

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

test('(redirect) exports', t => {
	t.is(typeof fn, 'function', 'exports a function');
	t.end();
});

test('(redirect) defaults', t => {
	let res = Response('/foo/bar/baz');
	fn(res);
	t.is(res.statusCode, 302, '~> uses 302 statusCode (default)');
	t.is(res.headers['Location'], '', '~> sets "Location" as empty (default)');
	t.end();
});

test('(redirect) location only', t => {
	let res = Response('/foo/bar/baz');
	fn(res, '/users/123');
	t.is(res.statusCode, 302, '~> uses 302 statusCode (default)');
	t.is(res.headers['Location'], '/users/123', '~> sets "Location" header correctly');
	t.end();
});

test('(redirect) statusCode and location', t => {
	let res = Response('/foo/bar/baz');
	fn(res, 301, '/users/123');
	t.is(res.statusCode, 301, '~> uses 301 statusCode (default)');
	t.is(res.headers['Location'], '/users/123', '~> sets "Location" header correctly');
	t.end();
});

test('(redirect) "back" ', t => {
	let res = Response('/foo/bar/baz');

	fn(res, 'back');
	t.is(res.statusCode, 302, '~> uses 302 statusCode (default)');
	t.is(res.headers['Location'], '/', '~> uses "/" Location (default)');

	fn(res, 301, 'back');
	t.is(res.statusCode, 301, '~> uses 301 statusCode (custom)');
	t.is(res.headers['Location'], '/', '~> uses "/" Location (default)');

	t.end();
});

test('(redirect) "back" w/ Referrer', t => {
	let res = Response('/foo/bar/baz', '/users/123');

	fn(res, 'back');
	t.is(res.statusCode, 302, '~> uses 302 statusCode (default)');
	t.is(res.headers['Location'], '/users/123', '~> uses "/users/123" Location ("Referrer")');

	fn(res, 301, 'back');
	t.is(res.statusCode, 301, '~> uses 301 statusCode (custom)');
	t.is(res.headers['Location'], '/users/123', '~> uses "/users/123" Location ("Referrer")');

	t.end();
});

test('(redirect) values – relatives', t => {
	[
		['/foo/bar', '/', '/'],
		['/foo/bar', './', '/foo/'],
		['/foo/bar/', './', '/foo/bar/'],
		['/foo/bar/', 'baz', '/foo/bar/baz'],
		['/foo/bar', 'baz', '/foo/baz'],
		['/foo/bar/', '../', '/foo/'],
		['/foo/bar', '../', '/'],
	].forEach(arr => {
		t.isRedirect(arr, 302);
	});

	t.end();
});

test('(redirect) redirect values', t => {
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
		t.isRedirect(arr, 302);
	});

	t.end();
});
