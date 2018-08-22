const { parse } = require('url');

module.exports = function (req) {
	let url = req.url;
	if (url === void 0) return url;

	let obj = req._parsedUrl;
	if (obj && obj._raw === url) return obj;

	obj = {};
	let c, len=url.length;
	obj.query = obj.search = null;
	obj.href = obj.path = obj.pathname = url;

	while (--len) {
		c = url.charCodeAt(len);
		if (c === 35) { // #
			obj = parse(url);
			break;
		} else if (c === 63) { // ?
			obj.search = url.substring(len);
			obj.query = obj.search.substring(1);
			obj.pathname = url.substring(0, len);
			break;
		}
	}

	obj._raw = url;

	return (req._parsedUrl = obj);
}
