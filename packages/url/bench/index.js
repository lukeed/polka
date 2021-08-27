/* eslint-disable no-console */
const native = require('url');
const qs = require('querystring');
const assert = require('uvu/assert');
const { Suite } = require('benchmark');

const polka = require('../build').parse;
const parseurl = require('parseurl');

// Print validation error details
const isVerbose = process.argv.includes('--verbose');

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
	'url.parse': r => {
		let out = native.parse(r.url, true); // query as object
		// returns `null` if no value
		out.search = out.search || '';
		return out;
	},

	'new URL()': r => {
		let url = r.url;
		let { pathname, search, searchParams } = new URL(url, 'http://x.com');
		return { url, pathname, search, query: searchParams };
	},

	'parseurl': r => {
		/** @type {Record<string, string>} */ // @ts-ignore
		let out = parseurl(r);

		// returns `null` if no value
		out.search = out.search || '';

		// @ts-ignore - always returns `query` as string|null
		if (out.query) out.query = qs.parse(out.query);

		return out;
	},

	'@polka/url': r => {
		// @ts-ignore - request
		return polka(r);
	},
};

/**
 * @param {object} config
 * @param {string} config.url
 * @param {Record<string, unknown>} config.expect
 * @param {boolean} [config.repeat]
 */
function runner(config) {
	let { url, expect, repeat } = config;
	let title = repeat ? 'repeat' : 'normal';

	console.log('\nValidation: (%s) "%s"', title, url);
	Object.keys(contenders).forEach(name => {
		let key, fn=contenders[name];

		try {
			let output = fn({ url });

			for (key in expect) {
				let tmp = output[key];
				if (tmp instanceof URLSearchParams) {
					tmp = Object.fromEntries(tmp);
				} else if (tmp && typeof tmp === 'object') {
					tmp = { ...tmp }; // null prototypes
				}
				assert.equal(tmp, expect[key]);
			}
			console.log('  ✔', name);
		} catch (err) {
			console.log('  ✘', name, `(FAILED @ "${key}")`);
			if (isVerbose) console.log(err.details);
		}
	});

	console.log('\nBenchmark: (%s) "%s"', title, url);
	let bench = new Suite().on('cycle', e => {
		console.log('  ' + e.target);
	});

	Object.keys(contenders).forEach(name => {
		let fn = contenders[name];
		let req = repeat && { url };

		bench.add(name + ' '.repeat(16 - name.length), () => {
			fn(req || { url });
		}, {
			minSamples: 100
		});
	});

	bench.run();
}

// ---

runner({
	url: '/foo/bar?user=tj&pet=fluffy',
	expect: {
		pathname: '/foo/bar',
		search: '?user=tj&pet=fluffy',
		query: {
			user: 'tj',
			pet: 'fluffy',
		}
	}
});

runner({
	repeat: true,
	url: '/foo/bar?user=tj&pet=fluffy',
	expect: {
		pathname: '/foo/bar',
		search: '?user=tj&pet=fluffy',
		query: {
			user: 'tj',
			pet: 'fluffy',
		}
	}
});

runner({
	url: '/foo/bar',
	expect: {
		pathname: '/foo/bar',
		search: '',
	}
});

runner({
	url: '/',
	expect: {
		pathname: '/',
		search: '',
	}
});
