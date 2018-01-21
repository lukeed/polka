const axios = require('axios');
const { Response } = require('./util/mock');
const { test, toStatusText, listen } = require('./util');
const send = require('../packages/send-type');

const TYPE = 'Content-Type';
const LENGTH = 'Content-Length';

test('polka/send-type', t => {
	t.is(typeof send, 'function', 'exports a function');
	t.end();
});

test('polka/send-type::usage::basic', t => {
	let res = new Response();
	let str = toStatusText(200);
	send(res);
	t.is(res.statusCode, 200, 'default statusCode: 200');
	t.is(res.getHeaderNames().length, 2, 'custom headers added: 2');
	t.is(res.getHeader(TYPE), 'text/plain', 'custom header[type]: text/plain');
	t.is(res.getHeader(LENGTH), 2, 'custom header[length]: 2');
	t.is(res.body, str, `fallback body: ${str}`);
	t.end();
});

test('polka/send-type::usage::custom::code', t => {
	let res = new Response();
	let str = toStatusText(404);
	send(res, 404);
	t.is(res.statusCode, 404, 'set statusCode: 404');
	t.is(res.getHeaderNames().length, 2, 'custom headers added: 2');
	t.is(res.getHeader(TYPE), 'text/plain', 'custom header[type]: text/plain');
	t.is(res.getHeader(LENGTH), str.length, `custom header[length]: ${str.length}`);
	t.is(res.body, str, `fallback body: ${str}`);
	t.end();
});

test('polka/send-type::usage::custom::body', t => {
	let str = 'FOOBAR';
	let res = new Response();
	send(res, 405, str);
	t.is(res.statusCode, 405, 'set statusCode: 405');
	t.is(res.getHeaderNames().length, 2, 'custom headers added: 2');
	t.is(res.getHeader(TYPE), 'text/plain', 'custom header[type]: text/plain');
	t.is(res.getHeader(LENGTH), str.length, `custom header[length]: ${str.length}`);
	t.is(res.body, str, `custom body: ${str}`);
	t.end();
});

test('polka/send-type::usage::custom::body::object', t => {
	let res = new Response();
	let obj = { foo:123, bar:456 };
	let str = JSON.stringify(obj);
	send(res, 200, obj); // send object
	t.is(res.statusCode, 200, 'set statusCode: 200');
	t.is(res.getHeaderNames().length, 2, 'custom headers added: 2');
	t.is(res.getHeader(TYPE), 'application/json;charset=utf-8', 'custom header[type]: application/json');
	t.is(res.getHeader(LENGTH), str.length, `custom header[length]: ${str.length}`);
	t.is(res.body, str, `custom body: ${str} (as JSON string)`);
	t.end();
});

test('polka/send-type::usage::custom::body::object', t => {
	let res = new Response();
	let str = Buffer.from('foobar');
	send(res, 200, str);
	t.is(res.statusCode, 200, 'set statusCode: 200');
	t.is(res.getHeaderNames().length, 2, 'custom headers added: 2');
	t.is(res.getHeader(TYPE), 'application/octet-stream', 'custom header[type]: application/octet-stream');
	t.is(res.getHeader(LENGTH), str.length, `custom header[length]: ${str.length}`);
	t.is(res.body, str, `custom body: ${str} (as JSON string)`);
	t.end();
});

test('polka/send-type::usage::custom::headers', t => {
	let str = 'Hello';
	let res = new Response();
	send(res, 500, str, {
		[TYPE]: 'foo/bar',
		'x-foo': 'hello',
		'x-bar': 'world'
	});
	t.is(res.statusCode, 500, 'set statusCode: 500');
	t.is(res.getHeaderNames().length, 4, 'total headers added: 4');
	t.is(res.getHeader(TYPE), 'foo/bar', 'custom header[type]: foo/bar');
	t.is(res.getHeader(LENGTH), str.length, `custom header[length]: ${str.length}`);
	t.is(res.getHeader('x-foo'), 'hello', 'custom header[x-foo]: hello');
	t.is(res.getHeader('x-bar'), 'world', 'custom header[x-bar]: world');
	t.is(res.body, str, `custom body: ${str}`);
	t.end();
});

test('polka/send-type::usage::custom::headers::object', t => {
	let obj = { foo:123 };
	let str = JSON.stringify(obj);
	let res = new Response();
	send(res, 500, obj, { [TYPE]:'foo/bar' });
	t.is(res.statusCode, 500, 'set statusCode: 500');
	t.is(res.getHeaderNames().length, 2, 'total headers added: 2');
	t.is(res.getHeader(TYPE), 'application/json;charset=utf-8', 'ENFORCE header[type]: application/json');
	t.is(res.getHeader(LENGTH), str.length, `custom header[length]: ${str.length}`);
	t.is(res.body, str, `custom body: ${str}`);
	t.end();
});

test('polka/send-type::usage::custom::headers::buffer', t => {
	let str = Buffer.from('hello');
	let res = new Response();
	send(res, 200, str, { [TYPE]: 'foo/bar' });
	t.is(res.statusCode, 200, 'set statusCode: 200');
	t.is(res.getHeaderNames().length, 2, 'total headers added: 2');
	t.is(res.getHeader(TYPE), 'foo/bar', 'prefer provided header[type] value: foo/bar');
	t.is(res.getHeader(LENGTH), str.length, `custom header[length]: ${str.length}`);
	t.is(res.body, str, `custom body: ${str}`);
	t.end();
});
