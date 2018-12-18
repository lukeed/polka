exports.json = function (opts={}) {
	const limit = opts.limit || 100 * 1024; // 100kb
	const type = opts.type || 'application/json';

	return function (req, res, next) {
		if (req._body) return next();
		req.body = req.body || {};

		const head = req.headers;
		const ctype = head['content-type'];
		const clength = parseInt(head['content-length'], 10);

		if (isNaN(clength) && head['transfer-encoding'] == null) return next(); // no body
		if (ctype && !ctype.includes(type)) return next(); // not json
		if (clength === 0) return next(); // is empty

		let bits = [];
		let length = 0;
		req.on('data', x => {
			length += Buffer.byteLength(x);
			if (length <= limit) {
				bits.push(x);
			} else {
				next({
					code: 413,
					details: 'Exceeded JSON limit'
				});
				req.destroy();
			}
		}).on('end', () => {
			try {
				req.body = JSON.parse(bits);
				req._body = true;
				next();
			} catch (err) {
				err.code = 422;
				err.details = err.message;
				err.message = 'Invalid JSON';
				next(err);
			}
		}).on('error', next);
	};
}
