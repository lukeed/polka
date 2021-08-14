import * as qs from 'querystring';

/**
 * @typedef ParsedURL
 * @type {import('.').ParsedURL}
 */

/**
 * @typedef Request
 * @property {string} url
 * @property {boolean} _decoded
 * @property {ParsedURL} _parsedUrl
 */

/**
 * @param {Request} req
 * @param {boolean} [toDecode]
 * @returns {ParsedURL|void}
 */
export function parse(req, toDecode) {
	let raw = req.url;
	if (raw == null) return;

	let prev=req._parsedUrl, encoded=!req._decoded;
	if (prev && prev.raw === raw && !toDecode === encoded) return prev;

	let pathname=raw, search='', query;

	if (raw.length > 1) {
		let idx = raw.indexOf('?', 1);

		if (idx !== -1) {
			search = raw.substring(idx);
			pathname = raw.substring(0, idx);
			if (search.length > 1) {
				query = qs.parse(search.substring(1));
			}
		}

		if (!!toDecode && encoded) {
			req._decoded = true;
			if (pathname.indexOf('%') !== -1) {
				try { pathname = decodeURIComponent(pathname) }
				catch (e) { /* URI malformed */ }
			}
		}
	}

	return req._parsedUrl = { pathname, search, query, raw };
}
