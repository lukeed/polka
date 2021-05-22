/**
 * NO NORMALIZATION ATTEMPTS MADE
 * AKA: All candidates different / no validations
 */

const native = require('url');
const qs = require('querystring');
const assert = require('uvu/assert');
const { Suite } = require('benchmark');

const polka = require('../build').parse;
const parseurl = require('parseurl');

/**
 * @typedef Request
 * @property {string} url
 */

/**
 * @typedef Contender
 * @type {(req: Request) => any}
 */

/**
 * All benchmark candidates!
 * @NOTE Some are modified for decoding validation
 * @type {Record<string, Contender>}
 */
const contenders = {
	'url.parse#1': r => native.parse(r.url, true),
	'url.parse#2': r => native.parse(r.url, false),

	'new URL()': r => new URL(r.url, 'http://x'),

	// @ts-ignore - r type
	'parseurl': r => parseurl(r),

	// @ts-ignore - r type
	'@polka/url': r => polka(r),
};

/**
 * @param {string} url
 * @param {boolean} [toRepeat]
 */
function runner(url, toRepeat) {
	let title = toRepeat ? 'repeat' : 'normal';

	console.log('\nBenchmark: (%s) "%s"', title, url);
	let bench = new Suite().on('cycle', e => {
		console.log('  ' + e.target);
	});

	Object.keys(contenders).forEach(name => {
		let fn = contenders[name];
		let req = toRepeat && { url };

		bench.add(name + ' '.repeat(16 - name.length), () => {
			fn(req || { url });
		}, {
			minSamples: 100
		});
	});

	bench.run();
}

// ---

runner('/foo/bar?user=tj&pet=fluffy');
runner('/foo/bar?user=tj&pet=fluffy', true);
runner('/foo/bar');
runner('/');
