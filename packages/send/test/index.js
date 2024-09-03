import fs from 'fs';
import { createRequire } from 'module';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { Response, toStatusText } from './util/index.js';
import send from '../index.js';
    
const __dirname = dirname(fileURLToPath(import.meta.url));

const TYPE = 'Content-Type';
const LENGTH = 'Content-Length';
const require = createRequire(import.meta.url);
const INPUT = require.resolve('../');

const basics = suite('basics');

basics('should export a function', () => {
	assert.type(send, 'function');
});

basics('usage', () => {
	let res = new Response();
	let str = toStatusText(200);
	send(res);
	assert.is(res.statusCode, 200, 'default statusCode: 200');
	assert.is(res.getHeaderNames().length, 2, 'custom headers added: 2');
	assert.is(res.getHeader(TYPE), 'text/plain', 'custom header[type]: text/plain');
	assert.is(res.getHeader(LENGTH), 2, 'custom header[length]: 2');
	assert.is(res.body, str, `fallback body: ${str}`);
});

basics.run();

// ---

const status = suite('statusCode');

status('should set `res.statusCode` value', () => {
	let res = new Response();
	let str = toStatusText(404);
	send(res, 404);
	assert.is(res.statusCode, 404, 'set statusCode: 404');
	assert.is(res.getHeaderNames().length, 2, 'custom headers added: 2');
	assert.is(res.getHeader(TYPE), 'text/plain', 'custom header[type]: text/plain');
	assert.is(res.getHeader(LENGTH), str.length, `custom header[length]: ${str.length}`);
	assert.is(res.body, str, `fallback body: ${str}`);
});

status('should accept any status code value', () => {
	let res = new Response();
	let str = '123';
	send(res, 123); // unknown, but your fault
	assert.is(res.statusCode, 123, 'set statusCode: 123');
	assert.is(res.getHeaderNames().length, 2, 'custom headers added: 2');
	assert.is(res.getHeader(TYPE), 'text/plain', 'custom header[type]: text/plain');
	assert.is(res.getHeader(LENGTH), str.length, `custom header[length]: ${str.length}`);
	assert.is(res.body, str, `fallback body: ${str}`);
});

status('should send empty response content when is `204` code', () => {
	let res = new Response();
	send(res, 204);
	assert.is(res.statusCode, 204, 'set statusCode: 204');
	assert.is(res.getHeaderNames().length, 0, 'custom headers added: 0');
	assert.not(res.hasHeader(TYPE), '~> removes header[type]');
	assert.not(res.hasHeader(LENGTH), '~> removes header[length]');
	assert.is(res.body, '', 'empty body');
});

status('should send empty response content when is `304` code', () => {
	let res = new Response();
	send(res, 304);
	assert.is(res.statusCode, 304, 'set statusCode: 304');
	assert.is(res.getHeaderNames().length, 0, 'custom headers added: 0');
	assert.not(res.hasHeader(TYPE), '~> removes header[type]');
	assert.not(res.hasHeader(LENGTH), '~> removes header[length]');
	assert.is(res.body, '', 'empty body');
});

status.run();

// ---

const HEAD = suite('HEAD');

HEAD('with String', () => {
	let str = 'FOOBAR';
	let method = 'HEAD';
	let res = new Response({ method });
	send(res, 200, str);
	assert.is(res.statusCode, 200, 'set statusCode: 200');
	assert.is(res.getHeaderNames().length, 2, 'custom headers added: 2');
	assert.is(res.getHeader(TYPE), 'text/plain', 'custom header[type]: text/plain');
	assert.is(res.getHeader(LENGTH), str.length, `custom header[length]: ${str.length}`);
	assert.is(res.body, '', 'empty body');
});

HEAD('with Object', () => {
	let method = 'HEAD';
	let obj = { foo:123, bar:456 };
	let res = new Response({ method });
	let str = JSON.stringify(obj);

	// @ts-ignore - TODO: types
	send(res, 200, obj);
	assert.is(res.statusCode, 200, 'set statusCode: 200');
	assert.is(res.getHeaderNames().length, 2, 'custom headers added: 2');
	assert.is(res.getHeader(TYPE), 'application/json; charset=utf-8', 'custom header[type]: application/json');
	assert.is(res.getHeader(LENGTH), str.length, `custom header[length]: ${str.length}`);
	assert.is(res.body, '', 'empty body');
});

HEAD.run();

// ---

const Strings = suite('body/String');

Strings('should handle String content', () => {
	let str = 'FOOBAR';
	let res = new Response();
	send(res, 405, str);
	assert.is(res.statusCode, 405, 'set statusCode: 405');
	assert.is(res.getHeaderNames().length, 2, 'custom headers added: 2');
	assert.is(res.getHeader(TYPE), 'text/plain', 'custom header[type]: text/plain');
	assert.is(res.getHeader(LENGTH), str.length, `custom header[length]: ${str.length}`);
	assert.is(res.body, str, `custom body: ${str}`);
});

Strings.run();

// ---

const Objects = suite('body/Object');

Objects('should handle Object content', () => {
	let res = new Response();
	let obj = { foo:123, bar:456 };
	let str = JSON.stringify(obj);
	// @ts-ignore - TODO: types
	send(res, 200, obj); // send object
	assert.is(res.statusCode, 200, 'set statusCode: 200');
	assert.is(res.getHeaderNames().length, 2, 'custom headers added: 2');
	assert.is(res.getHeader(TYPE), 'application/json; charset=utf-8', 'custom header[type]: application/json');
	assert.is(res.getHeader(LENGTH), str.length, `custom header[length]: ${str.length}`);
	assert.is(res.body, str, `custom body: ${str} (as JSON string)`);
});

Objects.run();

// ---

const Buffers = suite('body/buffer');

Buffers('should handle Buffer content', () => {
	let res = new Response();
	let str = Buffer.from('foobar');
	// @ts-ignore - TODO: types
	send(res, 200, str);
	assert.is(res.statusCode, 200, 'set statusCode: 200');
	assert.is(res.getHeaderNames().length, 2, 'custom headers added: 2');
	assert.is(res.getHeader(TYPE), 'application/octet-stream', 'custom header[type]: application/octet-stream');
	assert.is(res.getHeader(LENGTH), str.length, `custom header[length]: ${str.length}`);
	assert.is(res.body, str, `custom body: ${str} (as JSON string)`);
});

Buffers.run();

// ---

const headers = suite('headers');

headers('String', () => {
	let str = 'Hello';
	let res = new Response();
	send(res, 500, str, {
		[TYPE]: 'foo/bar',
		'x-foo': 'hello',
		'x-bar': 'world'
	});
	assert.is(res.statusCode, 500, 'set statusCode: 500');
	assert.is(res.getHeaderNames().length, 4, 'total headers added: 4');
	assert.is(res.getHeader(TYPE), 'foo/bar', 'custom header[type]: foo/bar');
	assert.is(res.getHeader(LENGTH), str.length, `custom header[length]: ${str.length}`);
	assert.is(res.getHeader('x-foo'), 'hello', 'custom header[x-foo]: hello');
	assert.is(res.getHeader('x-bar'), 'world', 'custom header[x-bar]: world');
	assert.is(res.body, str, `custom body: ${str}`);
});

headers('Object', () => {
	let obj = { foo:123 };
	let str = JSON.stringify(obj);
	let res = new Response();
	// @ts-ignore - TODO: types
	send(res, 500, obj, { [TYPE]:'foo/bar' });
	assert.is(res.statusCode, 500, 'set statusCode: 500');
	assert.is(res.getHeaderNames().length, 2, 'total headers added: 2');
	assert.is(res.getHeader(TYPE), 'foo/bar', 'allow Content-Type override: foo/bar');
	assert.is(res.getHeader(LENGTH), str.length, `custom header[length]: ${str.length}`);
	assert.is(res.body, str, `custom body: ${str}`);
});

headers('Object :: case insensitive', () => {
	let obj = { foo:123 };
	let str = JSON.stringify(obj);

	let foo = new Response();
	// @ts-ignore - TODO: types
	send(foo, 500, obj, { 'content-type':'foo/bar' });
	assert.is(foo.statusCode, 500, 'set statusCode: 500');
	assert.is(foo.getHeaderNames().length, 2, 'total headers added: 2');
	assert.is(foo.getHeader(TYPE), 'foo/bar', 'allow Content-Type override: foo/bar');
	assert.is(foo.getHeader(LENGTH), str.length, `custom header[length]: ${str.length}`);
	assert.is(foo.body, str, `custom body: ${str}`);

	let bar = new Response();
	// @ts-ignore - TODO: types
	send(bar, 500, obj, { 'cOnTeNt-TyPe':'foo/bar' });
	assert.is(bar.statusCode, 500, 'set statusCode: 500');
	assert.is(bar.getHeaderNames().length, 2, 'total headers added: 2');
	assert.is(bar.getHeader(TYPE), 'foo/bar', 'allow Content-Type override: foo/bar');
	assert.is(bar.getHeader(LENGTH), str.length, `custom header[length]: ${str.length}`);
	assert.is(bar.body, str, `custom body: ${str}`);

});

headers('Object :: respect existing', () => {
	let obj = { foo:123 };
	let str = JSON.stringify(obj);
	let res = new Response();
	res.setHeader('Content-Type', 'custom/type');
	// @ts-ignore - TODO: types
	send(res, 500, obj);
	assert.is(res.statusCode, 500, 'set statusCode: 500');
	assert.is(res.getHeaderNames().length, 2, 'total headers added: 2');
	assert.is(res.getHeader(TYPE), 'custom/type', 'reuse Content-Type from header: custom/type');
	assert.is(res.getHeader(LENGTH), str.length, `custom header[length]: ${str.length}`);
	assert.is(res.body, str, `custom body: ${str}`);
});

headers('Buffer', () => {
	let str = Buffer.from('hello');
	let res = new Response();
	// @ts-ignore - TODO: types
	send(res, 200, str, { [TYPE]: 'foo/bar' });
	assert.is(res.statusCode, 200, 'set statusCode: 200');
	assert.is(res.getHeaderNames().length, 2, 'total headers added: 2');
	assert.is(res.getHeader(TYPE), 'foo/bar', 'prefer provided header[type] value: foo/bar');
	assert.is(res.getHeader(LENGTH), str.length, `custom header[length]: ${str.length}`);
	assert.is(res.body, str, `custom body: ${str}`);
});

headers.run();

// ---

const Streams = suite('body/stream');

Streams('should handle piped Stream-like responses', async () => {
	let buffer = '';
	let rr = fs.createReadStream(INPUT);

	// "Response" stand-in (accepts pipe)
	let output = join(__dirname, 'out.js');
	let rw = fs.createWriteStream(output).on('pipe', stream => {
		assert.is(stream.constructor.name, 'ReadStream', '~> "response" receives the pipe');
		stream.on('data', x => { buffer += x });
	});

	rw.headers = {};

	rw.setHeader = (key, val) => {
		rw.headers[key] = val;
	};

	rw.getHeader = (key) => {
		return rw.headers[key];
	};

	let out = send(rw, 200, rr);

	await new Promise((res, rej) => {
		rw.on('close', res).on('error', rej);
	});

	assert.equal(out, rw, 'returns the "response" to itself');
	assert.is(rw.headers[TYPE], 'application/octet-stream', 'applies `Content-Type: application/octet-stream` header');

	assert.ok(buffer.length > 0, '~> "response" written');
	if (fs.existsSync(output)) fs.unlinkSync(output); // ~> cleanup
});

Streams('should respect existing headers w/ stream responses', async () => {
	let buffer = '';
	let rr = fs.createReadStream(INPUT);

	// "Response" stand-in (accepts pipe)
	let output = join(__dirname, 'out.js');
	let rw = fs.createWriteStream(output).on('pipe', stream => {
		assert.is(stream.constructor.name, 'ReadStream', '~> "response" receives the pipe');
		stream.on('data', x => { buffer += x });
	});

	rw.headers = {};

	rw.setHeader = (key, val) => {
		rw.headers[key] = val;
	};

	rw.getHeader = (key) => {
		return rw.headers[key];
	};

	rw.setHeader(TYPE.toLowerCase(), 'custom/stream');

	let out = send(rw, 200, rr);

	await new Promise((res, rej) => {
		rw.on('close', res).on('error', rej);
	});

	assert.equal(out, rw, 'returns the "response" to itself');
	assert.is(rw.headers[TYPE.toLowerCase()], 'custom/stream', 'maintains `Content-Type: custom/stream` header');

	assert.ok(buffer.length > 0, '~> "response" written');
	if (fs.existsSync(output)) fs.unlinkSync(output); // ~> cleanup
});

Streams.run();

// ---

const ETag = suite('ETag');

ETag('should append "ETag" header value', () => {
	let str = 'FOOBAR';
	let res = new Response();
	send(res, 200, str, { etag: true });
	assert.is(res.statusCode, 200, 'set statusCode: 200');
	assert.is(res.getHeaderNames().length, 3, 'custom headers added: 3');
	assert.is(res.getHeader(TYPE), 'text/plain', 'custom header[type]: text/plain');
	assert.is(res.getHeader(LENGTH), str.length, `custom header[length]: ${str.length}`);
	assert.is(res.getHeader('ETag'), 'W/"6-8zkP4uVUbaw9GWiXDfGiIqOjnAA"', 'custom header[ETag]: correct');
	assert.is(res.body, str, `custom body: ${str}`);
});

ETag('should still add "ETag" header to HEAD requests', () => {
	let str = 'FOOBAR';
	let method = 'HEAD';
	let res = new Response({ method });
	send(res, 200, str, { etag: true });
	assert.is(res.statusCode, 200, 'set statusCode: 200');
	assert.is(res.getHeaderNames().length, 3, 'custom headers added: 3');
	assert.is(res.getHeader(TYPE), 'text/plain', 'custom header[type]: text/plain');
	assert.is(res.getHeader(LENGTH), str.length, `custom header[length]: ${str.length}`);
	assert.is(res.getHeader('ETag'), 'W/"6-8zkP4uVUbaw9GWiXDfGiIqOjnAA"', 'custom header[ETag]: correct');
	assert.is(res.body, '', 'empty body');
});

ETag('should still add "ETag" header to `204` responses', () => {
	let str = 'FOOBAR';
	let res = new Response();
	send(res, 204, str, { etag: true });
	assert.is(res.statusCode, 204, 'set statusCode: 204');
	assert.is(res.getHeaderNames().length, 1, 'custom headers added: 1');
	assert.not(res.hasHeader(TYPE), '~> removes header[type]');
	assert.not(res.hasHeader(LENGTH), '~> removes header[length]');
	assert.is(res.getHeader('ETag'), 'W/"6-8zkP4uVUbaw9GWiXDfGiIqOjnAA"', 'custom header[ETag]: correct');
	assert.is(res.body, '', 'empty body');
});

ETag.run();
