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
 * @type {(req: Request, toDecode: boolean) => any}
 */

/**
 * All benchmark candidates!
 * @NOTE Some are modified for decoding validation
 * @type {Record<string, Contender>}
 */
const contenders = {
	'url.parse': (r, d) => {
		let out = native.parse(r.url, true); // query as object
		if (d) out.pathname = decodeURIComponent(out.pathname);
		// returns `null` if no value
		out.search = out.search || '';
		return out;
	},

	'new URL()': (r, d) => {
		let url = r.url;
		let { pathname, search, searchParams } = new URL(url, 'http://x.com');
		if (d) pathname = decodeURIComponent(pathname);
		return { url, pathname, search, query: searchParams };
	},

	'parseurl': (r, d) => {
		/** @type {Record<string, string>} */ // @ts-ignore
		let out = parseurl(r);

		// returns `null` if no value
		out.search = out.search || '';

		// @ts-ignore - always returns `query` as string|null
		if (out.query) out.query = qs.parse(out.query);

		// never decodes, do bare minimum for compat
		if (d) out.pathname = decodeURIComponent(out.pathname);

		return out;
	},

	'@polka/url': (r, d) => {
		// @ts-ignore - request
		return polka(r, d);
	},
};

/**
 * @param {object} config
 * @param {string} config.url
 * @param {boolean} config.decode
 * @param {Record<string, unknown>} config.expect
 * @param {boolean} [config.repeat]
 */
function runner(config) {
	let { url, expect, repeat, decode=false } = config;
	let title = repeat ? 'repeat' : decode ? 'decode' : 'normal';

	console.log('\nValidation: (%s) "%s"', title, url);
	Object.keys(contenders).forEach(name => {
		let key, fn=contenders[name];

		try {
			let output = fn({ url }, decode);

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
			fn(req || { url }, decode);
		}, {
			minSamples: 100
		});
	});

	bench.run();
}

// ---

runner({
	url: '/foo/bar?user=tj&pet=fluffy',
	decode: false,
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
	decode: false,
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
	decode: false,
	expect: {
		pathname: '/foo/bar',
		search: '',
	}
});

runner({
	url: '/',
	decode: false,
	expect: {
		pathname: '/',
		search: '',
	}
});

// DECODES

runner({
	url: '/f%C3%B8%C3%B8%C3%9F%E2%88%82r',
	decode: true,
	expect: {
		pathname: '/føøß∂r',
		search: '',
	}
});

runner({
	url: '/f%C3%B8%C3%B8%C3%9F%E2%88%82r?phone=%2b393383123549',
	decode: true,
	expect: {
		pathname: '/føøß∂r',
		search: '?phone=%2b393383123549',
		query: { phone: '+393383123549' },
	}
});

runner({
	repeat: true,
	url: '/f%C3%B8%C3%B8%C3%9F%E2%88%82r?phone=%2b393383123549',
	decode: true,
	expect: {
		pathname: '/føøß∂r',
		search: '?phone=%2b393383123549',
		query: { phone: '+393383123549' },
	}
});

runner({
	url: '/foo/bar?hello=123',
	decode: true,
	expect: {
		pathname: '/foo/bar',
		search: '?hello=123',
		query: {
			hello: '123',
		}
	}
});

runner({
	url: '/foo/bar',
	decode: true,
	expect: {
		pathname: '/foo/bar',
		search: '',
	}
});
