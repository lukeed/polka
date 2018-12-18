module.exports = function (req) {
	let url = req.url;
	if (url == null) return;

	let obj = req._parsedUrl;
	if (obj && obj._raw === url) return obj;

	if (url.length > 1 && !req._decoded) {
		url = req.url = decodeURIComponent(url);
		req._decoded = true;
	}

	obj = {};
	obj.query = obj.search = null;
	obj.href = obj.path = obj.pathname = url;

	let idx = url.indexOf('?', 1);
	if (idx !== -1) {
		obj.search = url.substring(idx);
		obj.query = obj.search.substring(1);
		obj.pathname = url.substring(0, idx);
	}

	obj._raw = url;

	return (req._parsedUrl = obj);
}
