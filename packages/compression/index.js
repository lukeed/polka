import zlib from 'zlib';

/* global Buffer */

const MIMES = /text|javascript|\/json|xml/i;

const noop = () => {};

const getChunkSize = (chunk, enc) => chunk ? Buffer.byteLength(chunk, enc) : 0;

/**
 * @param {object} [options]
 * @param {number} [options.threshold = 1024] Don't compress responses below this size (in bytes)
 * @param {number} [options.level = -1] Gzip/Brotli compression effort (1-11, or -1 for default)
 * @param {boolean} [options.brotli = false] Generate and serve Brotli-compressed responses
 * @param {boolean} [options.gzip = true] Generate and serve Gzip-compressed responses
 * @param {RegExp} [options.mimes] Regular expression of response MIME types to compress (default: text|javascript|json|xml)
 * @returns {(req: Pick<import('http').IncomingMessage, 'method'|'headers'>, res: import('http').ServerResponse, next?:Function) => void}
 * @retur {import('polka').Middleware}
 */
export default function compression({ threshold = 1024, level = -1, brotli = false, gzip = true, mimes = MIMES } = {}) {
	const brotliOpts = (typeof brotli === 'object' && brotli) || {};
	const gzipOpts = (typeof gzip === 'object' && gzip) || {};

	// disable Brotli on Node<12.7 where it is unsupported:
	if (!zlib.createBrotliCompress) brotli = false;

	return (req, res, next = noop) => {
		const accept = req.headers['accept-encoding'] + '';
		const encoding = ((brotli && accept.match(/\bbr\b/)) || (gzip && accept.match(/\bgzip\b/)) || [])[0];

		// skip if no response body or no supported encoding:
		if (req.method === 'HEAD' || !encoding) return next();

		/** @type {zlib.Gzip | zlib.BrotliCompress} */
		let compress;
		let pendingStatus;
		let started = false;
		let size = 0;

		function start() {
			started = true;
			// @ts-ignore
			size = res.getHeader('Content-Length') | 0 || size;
			const compressible = mimes.test(String(res.getHeader('Content-Type') || 'text/plain'));
			const cleartext = !res.getHeader('Content-Encoding');
			if (compressible && cleartext && size >= threshold) {
				res.setHeader('Content-Encoding', encoding);
				res.removeHeader('Content-Length');
				if (encoding === 'br') {
					const params = {
						[zlib.constants.BROTLI_PARAM_QUALITY]: level,
						[zlib.constants.BROTLI_PARAM_SIZE_HINT]: size
					};
					compress = zlib.createBrotliCompress({ params: Object.assign(params, brotliOpts) });
				} else {
					compress = zlib.createGzip(Object.assign({ level }, gzipOpts));
				}
				// backpressure
				compress.on('data', (...args) => write.apply(res, args) === false && compress.pause());
				on.call(res, 'drain', () => compress.resume());
				compress.on('end', (...args) => end.apply(res, args));
			}

			const listeners = pendingListeners;
			pendingListeners = null;
			listeners.forEach(p => on.apply(res, p));
			writeHead.call(res, pendingStatus || res.statusCode);
		}

		const { end, write, on, writeHead } = res;

		res.writeHead = function (status, reason, headers) {
			if (typeof reason !== 'string') [headers, reason] = [reason, headers];
			if (headers) for (let i in headers) res.setHeader(i, headers[i]);
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

		let pendingListeners = [];
		res.on = function (type, listener) {
			if (!pendingListeners) on.call(this, type, listener);
			else if (compress) compress.on(type, listener);
			else pendingListeners.push([type, listener]);
			return this;
		};

		next();
	};
}
