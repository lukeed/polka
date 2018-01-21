const { test } = require('tape');
const { STATUS_CODES } = require('http');
const Response = require('./response');
const send = require('..');

const toBody = code => STATUS_CODES[code];

test('@polka/send', t => {
	t.is(typeof send, 'function', 'exports a function');
	t.end();
});

test('usage::basic', t => {
	let res = new Response();
	let str = toBody(200);
	send(res);
	t.is(res.statusCode, 200, 'default statusCode: 200');
	t.deepEqual(res.headers, {}, 'default headers: {}');
	t.is(res.body, str, `fallback body: ${str}`);
	t.end();
});

test('usage::custom::code', t => {
	let res = new Response();
	let str = toBody(404);
	send(res, 404);
	t.is(res.statusCode, 404, 'custom statusCode: 404');
	t.deepEqual(res.headers, {}, 'default headers: {}');
	t.is(res.body, str, `fallback body: ${str}`);
	t.end();
});

test('usage::custom::body', t => {
	let res = new Response();
	send(res, 405, 'FOOBAR');
	t.is(res.statusCode, 405, 'custom statusCode: 405');
	t.deepEqual(res.headers, {}, 'default headers: {}');
	t.is(res.body, 'FOOBAR', 'custom body: FOOBAR');
	t.end();
});

test('usage::custom::headers', t => {
	let res = new Response();
	send(res, 405, 'Hello', {
		'x-foo': 'hello',
		'x-bar': 'world'
	});
	t.is(res.statusCode, 405, 'custom statusCode: 405');
	t.is(res.getHeaderNames().length, 2, 'custom headers added: 2');
	t.is(res.getHeader('x-foo'), 'hello', 'custom headers[x-foo]: hello');
	t.is(res.getHeader('x-bar'), 'world', 'custom headers[x-bar]: world');
	t.is(res.body, 'Hello', 'custom body: Hello');
	t.end();
});
