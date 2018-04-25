const tape = require('tape');
const { STATUS_CODES } = require('http');

Object.assign(tape.Test.prototype, {
	isEmpty(val, msg) {
		this.ok(!Object.keys(val).length, msg);
	},
	isArray(val, msg) {
		this.ok(Array.isArray(val), msg);
	},
	isObject(val, msg) {
		this.ok(Boolean(val) && (val.constructor === Object), msg);
	},
	isFunction(val, msg) {
		this.is(typeof val, 'function', msg);
	}
});

exports.test = tape;

exports.toStatusText = code => STATUS_CODES[code];

exports.sleep = ms => new Promise(r => setTimeout(r, ms));

exports.listen = async function (app, host) {
	await app.listen(); // boots
	let { port } = app.server.address();
	return `http://${host || 'localhost'}:${port}`;
};
