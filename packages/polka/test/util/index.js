import * as assert from 'uvu/assert';

export function isEmpty(val, msg) {
	assert.ok(!Object.keys(val).length, msg);
}

export function isArray(val, msg) {
	assert.ok(Array.isArray(val), msg);
}

export function isObject(val, msg) {
	assert.is(Object.prototype.toString.call(val), '[object Object]', msg);
}

export function isFunction(val, msg) {
	assert.type(val, 'function', msg);
}

export function listen(app, host) {
	app.listen(); // boots
	let { port } = app.server.address();
	return `http://${host || 'localhost'}:${port}`;
}
