// NOTE: supports Node 6.x

import zlib from 'zlib';

const NOOP = () => {};
const MIMES = /text|javascript|\/json|xml/i;

/**
 * @param {any} chunk
 * @param {BufferEncoding} enc
 * @returns {number}
 */
function getChunkSize(chunk, enc) {
	return chunk ? Buffer.byteLength(chunk, enc) : 0;
}

/**
 * @param {import('./index.d.mts').Options} [options]
 * @returns {import('./index.d.mts').Middleware}
 */
export default function ({ threshold = 1024, level = -1, brotli = false, gzip = true, mimes = MIMES } = {}) {
	const brotliOpts = (typeof brotli === 'object' && brotli) || {};
	const gzipOpts = (typeof gzip === 'object' && gzip) || {};

	// disable Brotli on Node<12.7 where it is unsupported:
	if (!zlib.createBrotliCompress) brotli = false;

	return (req, res, next = NOOP) => {
		const accept = req.headers['accept-encoding'] + '';
		const encoding = ((brotli && /\bbr\b/.exec(accept)) || (gzip && /\bgzip\b/.exec(accept)) || [])[0];

		// skip if no response body or no supported encoding:
		if (req.method === 'HEAD' || !encoding) return next();

		/** @type {zlib.Gzip | zlib.BrotliCompress} */
		let compress;
		/** @type {Array<[string, function]>?} */
		let pendingListeners = [];
		let pendingStatus = 0;
		let started = false;
		let size = 0;

		function start() {
			started = true;
			// @ts-ignore
			size = res.getHeader('Content-Length') | 0 || size;
			const compressible = mimes.test(
				String(res.getHeader('Content-Type') || 'text/plain')
			);
			const cleartext = !res.getHeader('Content-Encoding');
			const listeners = pendingListeners || [];

			if (compressible && cleartext && size >= threshold) {
				res.setHeader('Content-Encoding', encoding);
				res.removeHeader('Content-Length');
				if (encoding === 'br') {
					compress = zlib.createBrotliCompress({
						params: Object.assign({
							[zlib.constants.BROTLI_PARAM_QUALITY]: level,
							[zlib.constants.BROTLI_PARAM_SIZE_HINT]: size,
						}, brotliOpts)
					});
				} else {
					compress = zlib.createGzip(
						Object.assign({ level }, gzipOpts)
					);
				}
				// backpressure
				compress.on('data', chunk => write.call(res, chunk) || compress.pause());
				on.call(res, 'drain', () => compress.resume());
				compress.on('end', () => end.call(res));
				listeners.forEach(p => compress.on.apply(compress, p));
			} else {
				pendingListeners = null;
				listeners.forEach(p => on.apply(res, p));
			}

			writeHead.call(res, pendingStatus || res.statusCode);
		}

		const { end, write, on, writeHead } = res;

		res.writeHead = function (status, reason, headers) {
			if (typeof reason !== 'string') [headers, reason] = [reason, headers];
			if (headers) for (let k in headers) res.setHeader(k, headers[k]);
			pendingStatus = status;
			return this;
		};

		res.write = function (chunk, enc) {
			size += getChunkSize(chunk, enc);
			if (!started) start();
			if (!compress) return write.apply(this, arguments);
			return compress.write.apply(compress, arguments);
		};

		res.end = function (chunk, enc) {
			if (arguments.length > 0 && typeof chunk !== 'function') {
				size += getChunkSize(chunk, enc);
			}
			if (!started) start();
			if (!compress) return end.apply(this, arguments);
			return compress.end.apply(compress, arguments);
		};

		res.on = function (type, listener) {
			if (!pendingListeners) on.call(this, type, listener);
			else if (compress) compress.on(type, listener);
			else pendingListeners.push([type, listener]);
			return this;
		};

		next();
	};
}
