const parse = require('regexparam');

class Trouter {
	constructor() {
		this.routes = [];

		this.all = this.add.bind(this, '');
		this.get = this.add.bind(this, 'GET');
		this.head = this.add.bind(this, 'HEAD');
		this.patch = this.add.bind(this, 'PATCH');
		this.options = this.add.bind(this, 'OPTIONS');
		this.connect = this.add.bind(this, 'CONNECT');
		this.delete = this.add.bind(this, 'DELETE');
		this.trace = this.add.bind(this, 'TRACE');
		this.post = this.add.bind(this, 'POST');
		this.put = this.add.bind(this, 'PUT');
	}

	add(method, route, ...handler) {
		let { keys, pattern } = parse(route);
		let path = '/' + route.match(/^\/?(.*?)\/?(:|\*|$)/)[1];
		this.routes.push({ keys, pattern, path, method, handler });
		return this;
	}

	find(method, url) {
		let isHEAD = (method === 'HEAD');
		let i=0, j=0, tmp, len, arr=this.routes;
		let matches=[], params={}, handlers=[];
		for (; i < arr.length; i++) {
			tmp = arr[i];
			if (tmp.method.length === 0 && url.indexOf(tmp.path) === 0) {
				tmp.handler.length > 1 ? (handlers=handlers.concat(tmp.handler)) : handlers.push(tmp.handler[0]);
			} else if (tmp.method === method || isHEAD && tmp.method === 'GET') {
				if ((len = tmp.keys.length) > 0) {
					matches = tmp.pattern.exec(url);
					if (matches === null) continue;
					for (j=0; j < len;) params[tmp.keys[j]]=matches[++j];
					tmp.handler.length > 1 ? (handlers=handlers.concat(tmp.handler)) : handlers.push(tmp.handler[0]);
				} else if (tmp.pattern.test(url)) {
					tmp.handler.length > 1 ? (handlers=handlers.concat(tmp.handler)) : handlers.push(tmp.handler[0]);
				}
			} // else not a match
		}

		return { params, handlers };
	}
}

module.exports = Trouter;
