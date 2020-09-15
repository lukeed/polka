import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { prep, toAscii } from './util/index';
import compression from '../index';

const GZIP = 'gzip, deflate';
const BR = 'br, gzip, deflate';

const instantiation = suite('instantiation');

instantiation('should export a function', () => {
	assert.type(compression, 'function');
});

instantiation('installs as middleware', () => {
	const { req, res } = prep('GET', GZIP);
	const middleware = compression();

	let calledNext = false;
	middleware(req, res, () => {
		calledNext = true;
	});
	assert.ok(calledNext);
});

instantiation('works without next callback', () => {
	const { req, res } = prep('GET', GZIP);
	const middleware = compression();
	assert.not.throws(() => middleware(req, res));
});

instantiation.run();

// ---

const basics = suite('basics');

basics('compresses content over threshold', () => {
	const { req, res } = prep('GET', GZIP);
	compression()(req, res);
	res.writeHead(200, { 'content-type': 'text/plain' })
	res.write('hello world'.repeat(1000));
	res.end();

	assert.is(res.getHeader('content-encoding'), 'gzip', 'above threshold triggers gzip');
});

basics('compresses content with no content-type', () => {
	const { req, res } = prep('GET', GZIP);
	compression({ threshold: 0 })(req, res);
	res.end('hello world');

	assert.is(res.getHeader('content-encoding'), 'gzip', 'above threshold triggers gzip');
});

basics('ignores content with unmatched content-type', async () => {
	const { req, res } = prep('GET', GZIP);
	compression({ threshold: 0 })(req, res);
	res.writeHead(200, { 'content-type': 'image/jpeg' });
	const content = 'hello world';
	res.end(content);

	assert.is(res.hasHeader('content-encoding'), false, 'no content-encoding header should be set');
	assert.is(await res.getResponseText(), content, 'content should be unmodified');
});

basics('preserves plaintext below threshold', async () => {
	const { req, res } = prep('GET', GZIP);
	compression()(req, res);
	res.writeHead(200, { 'content-type': 'text/plain' });
	const content = 'hello world'.repeat(20);
	res.end(content);

	assert.is(res.hasHeader('content-encoding'), false, 'below threshold triggers gzip');
	assert.is(await res.getResponseText(), content, 'content should be unmodified');
});

basics.run();

// ---

const brotli = suite('brotli');

brotli('compresses content with brotli when supported', async () => {
	const { req, res } = prep('GET', 'br');
	compression({ brotli: true, threshold: 0 })(req, res);
	res.writeHead(200, { 'content-type': 'text/plain' })
	res.end('hello world');

	const body = await res.getResponseData();

	assert.is(res.getHeader('content-encoding'), 'br', 'uses brotli encoding');
	assert.snapshot(toAscii(body), toAscii('\u000b\u0005\u0000hello world\u0003'), 'compressed content');
});

brotli('gives brotli precedence over gzip', () => {
	const { req, res } = prep('GET', BR);
	compression({ brotli: true, threshold: 0 })(req, res);
	res.writeHead(200, { 'content-type': 'text/plain' })
	res.end('hello world'.repeat(20));

	assert.is(res.getHeader('content-encoding'), 'br', 'uses brotli encoding');
});

brotli.run();
