function parse(str) {
	let i=0, j=0, k, v;
	let out={}, arr=str.split('&');
	for (; i < arr.length; i++) {
		j = arr[i].indexOf('=');
		v = !!~j && arr[i].substring(j+1) || '';
		k = !!~j ? arr[i].substring(0, j) : arr[i];
		out[k] = out[k] !== void 0 ? [].concat(out[k], v) : v;
	}
	return out;
}

export default function (req, toDecode) {
	let url = req.url;
	if (url == null) return;

	let obj = req._parsedUrl;
	if (obj && obj._raw === url) return obj;

	obj = {
		path: url,
		pathname: url,
		search: null,
		query: null,
		href: url,
		_raw: url
	};

	if (url.length > 1) {
		if (toDecode && !req._decoded && !!~url.indexOf('%', 1)) {
			let nxt = url;
			try { nxt = decodeURIComponent(url) } catch (e) {/* bad */}
			url = req.url = obj.href = obj.path = obj.pathname = obj._raw = nxt;
			req._decoded = true;
		}

		let idx = url.indexOf('?', 1);

		if (idx !== -1) {
			obj.search = url.substring(idx);
			obj.query = obj.search.substring(1);
			obj.pathname = url.substring(0, idx);
			if (toDecode && obj.query.length > 0) {
				obj.query = parse(obj.query);
			}
		}
	}

	return (req._parsedUrl = obj);
}
