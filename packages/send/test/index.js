import fs from 'fs';
import test from 'tape';
import { join } from 'path';
import { Response, toStatusText } from './util';
import send from '../index.mjs';

const TYPE = 'Content-Type';
const LENGTH = 'Content-Length';
const INPUT = require.resolve('../');

test('(send) exports', t => {
	t.is(typeof send, 'function', 'exports a function');
	t.end();
});

test('(send) basic', t => {
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

test('(send) statusCode', t => {
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

test('(send) statusCode – unknown', t => {
	let res = new Response();
	let str = '123';
	send(res, 123);
	t.is(res.statusCode, 123, 'set statusCode: 123');
	t.is(res.getHeaderNames().length, 2, 'custom headers added: 2');
	t.is(res.getHeader(TYPE), 'text/plain', 'custom header[type]: text/plain');
	t.is(res.getHeader(LENGTH), str.length, `custom header[length]: ${str.length}`);
	t.is(res.body, str, `fallback body: ${str}`);
	t.end();
});

test('(send) statusCode – 204', t => {
	let res = new Response();
	send(res, 204);
	t.is(res.statusCode, 204, 'set statusCode: 204');
	t.is(res.getHeaderNames().length, 0, 'custom headers added: 0');
	t.false(res.hasHeader(TYPE), '~> removes header[type]');
	t.false(res.hasHeader(LENGTH), '~> removes header[length]');
	t.is(res.body, '', 'empty body');
	t.end();
});

test('(send) statusCode – 304', t => {
	let res = new Response();
	send(res, 304);
	t.is(res.statusCode, 304, 'set statusCode: 304');
	t.is(res.getHeaderNames().length, 0, 'custom headers added: 0');
	t.false(res.hasHeader(TYPE), '~> removes header[type]');
	t.false(res.hasHeader(LENGTH), '~> removes header[length]');
	t.is(res.body, '', 'empty body');
	t.end();
});

test('(send) HEAD – String', t => {
	let str = 'FOOBAR';
	let method = 'HEAD';
	let res = new Response({ method });
	send(res, 200, str);
	t.is(res.statusCode, 200, 'set statusCode: 200');
	t.is(res.getHeaderNames().length, 2, 'custom headers added: 2');
	t.is(res.getHeader(TYPE), 'text/plain', 'custom header[type]: text/plain');
	t.is(res.getHeader(LENGTH), str.length, `custom header[length]: ${str.length}`);
	t.is(res.body, '', 'empty body');
	t.end();
});

test('(send) HEAD – Object', t => {
	let method = 'HEAD';
	let obj = { foo:123, bar:456 };
	let res = new Response({ method });
	let str = JSON.stringify(obj);
	send(res, 200, obj);
	t.is(res.statusCode, 200, 'set statusCode: 200');
	t.is(res.getHeaderNames().length, 2, 'custom headers added: 2');
	t.is(res.getHeader(TYPE), 'application/json; charset=utf-8', 'custom header[type]: application/json');
	t.is(res.getHeader(LENGTH), str.length, `custom header[length]: ${str.length}`);
	t.is(res.body, '', 'empty body');
	t.end();
});

test('(send) body – String', t => {
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

test('(send) body – Object', t => {
	let res = new Response();
	let obj = { foo:123, bar:456 };
	let str = JSON.stringify(obj);
	send(res, 200, obj); // send object
	t.is(res.statusCode, 200, 'set statusCode: 200');
	t.is(res.getHeaderNames().length, 2, 'custom headers added: 2');
	t.is(res.getHeader(TYPE), 'application/json; charset=utf-8', 'custom header[type]: application/json');
	t.is(res.getHeader(LENGTH), str.length, `custom header[length]: ${str.length}`);
	t.is(res.body, str, `custom body: ${str} (as JSON string)`);
	t.end();
});

test('(send) body – Buffer', t => {
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

test('(send) headers – String', t => {
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

test('(send) headers – Object', t => {
	let obj = { foo:123 };
	let str = JSON.stringify(obj);
	let res = new Response();
	send(res, 500, obj, { [TYPE]:'foo/bar' });
	t.is(res.statusCode, 500, 'set statusCode: 500');
	t.is(res.getHeaderNames().length, 2, 'total headers added: 2');
	t.is(res.getHeader(TYPE), 'foo/bar', 'allow Content-Type override: foo/bar');
	t.is(res.getHeader(LENGTH), str.length, `custom header[length]: ${str.length}`);
	t.is(res.body, str, `custom body: ${str}`);
	t.end();
});

test('(send) headers – Object :: respect existing', t => {
	let obj = { foo:123 };
	let str = JSON.stringify(obj);
	let res = new Response();
	res.setHeader('Content-Type', 'custom/type');
	send(res, 500, obj);
	t.is(res.statusCode, 500, 'set statusCode: 500');
	t.is(res.getHeaderNames().length, 2, 'total headers added: 2');
	t.is(res.getHeader(TYPE), 'custom/type', 'reuse Content-Type from header: custom/type');
	t.is(res.getHeader(LENGTH), str.length, `custom header[length]: ${str.length}`);
	t.is(res.body, str, `custom body: ${str}`);
	t.end();
});

test('(send) headers – Buffer', t => {
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

test('(send) body – Stream', t => {
	t.plan(5);

	// "Response" stand-in (accepts pipe)
	let output = join(__dirname, 'out.js');
	let rw = fs.createWriteStream(output).on('pipe', x => {
		t.is(x.constructor.name, 'ReadStream', '~> "response" receives the pipe');
	});

	rw.headers = {};

	rw.setHeader = (key, val) => {
		rw.headers[key] = val;
	};

	rw.getHeader = (key) => {
		return rw.headers[key];
	};

	let rr = fs.createReadStream(INPUT).on('end', () => {
		try {
			let info = fs.statSync(output);
			t.pass('~> "response" output exists');
			t.true(info.size > 0, '~~> data piped successfully');
		} catch (err) {
			//
		}
		fs.unlinkSync(output); // ~> cleanup
	});

	let out = send(rw, 200, rr);
	t.same(out, rw, 'returns the "response" to itself');
	t.is(rw.headers[TYPE], 'application/octet-stream', 'applies `Content-Type: application/octet-stream` header');
});

test('(send) body – Stream :: respect existing', t => {
	t.plan(5);

	// "Response" stand-in (accepts pipe)
	let output = join(__dirname, 'out.js');
	let rw = fs.createWriteStream(output).on('pipe', x => {
		t.is(x.constructor.name, 'ReadStream', '~> "response" receives the pipe');
	});

	rw.headers = {};

	rw.setHeader = (key, val) => {
		rw.headers[key] = val;
	};

	rw.getHeader = (key) => {
		return rw.headers[key];
	};

	let rr = fs.createReadStream(INPUT).on('end', () => {
		try {
			let info = fs.statSync(output);
			t.pass('~> "response" output exists');
			t.true(info.size > 0, '~~> data piped successfully');
		} catch (err) {
			//
		}
		fs.unlinkSync(output); // ~> cleanup
	});


	rw.setHeader(TYPE.toLowerCase(), 'custom/stream');

	let out = send(rw, 200, rr);
	t.same(out, rw, 'returns the "response" to itself');
	t.is(rw.headers[TYPE.toLowerCase()], 'custom/stream', 'maintains `Content-Type: custom/stream` header');
});

test('(send) ETag', t => {
	let str = 'FOOBAR';
	let res = new Response();
	send(res, 200, str, { etag:true });
	t.is(res.statusCode, 200, 'set statusCode: 200');
	t.is(res.getHeaderNames().length, 3, 'custom headers added: 3');
	t.is(res.getHeader(TYPE), 'text/plain', 'custom header[type]: text/plain');
	t.is(res.getHeader(LENGTH), str.length, `custom header[length]: ${str.length}`);
	t.is(res.getHeader('ETag'), 'W/"6-8zkP4uVUbaw9GWiXDfGiIqOjnAA"', 'custom header[ETag]: correct');
	t.is(res.body, str, `custom body: ${str}`);
	t.end();
});

test('(send) ETag – HEAD', t => {
	let str = 'FOOBAR';
	let method = 'HEAD';
	let res = new Response({ method });
	send(res, 200, str, { etag:true });
	t.is(res.statusCode, 200, 'set statusCode: 200');
	t.is(res.getHeaderNames().length, 3, 'custom headers added: 3');
	t.is(res.getHeader(TYPE), 'text/plain', 'custom header[type]: text/plain');
	t.is(res.getHeader(LENGTH), str.length, `custom header[length]: ${str.length}`);
	t.is(res.getHeader('ETag'), 'W/"6-8zkP4uVUbaw9GWiXDfGiIqOjnAA"', 'custom header[ETag]: correct');
	t.is(res.body, '', 'empty body');
	t.end();
});

test('(send) ETag – 204', t => {
	let str = 'FOOBAR';
	let res = new Response();
	send(res, 204, str, { etag:true });
	t.is(res.statusCode, 204, 'set statusCode: 204');
	t.is(res.getHeaderNames().length, 1, 'custom headers added: 1');
	t.false(res.hasHeader(TYPE), '~> removes header[type]');
	t.false(res.hasHeader(LENGTH), '~> removes header[length]');
	t.is(res.getHeader('ETag'), 'W/"6-8zkP4uVUbaw9GWiXDfGiIqOjnAA"', 'custom header[ETag]: correct');
	t.is(res.body, '', 'empty body');
	t.end();
});
