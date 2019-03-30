/* eslint-disable no-console */
global.native = require('url');
const { Suite } = require('benchmark');
global.querystring = require('querystring');
global.parseurl = require('parseurl');
global.parse = require('../');

global.nativeDecode = function (url) {
	let obj = global.native.parse(url, true);
	obj.href = obj.path = decodeURIComponent(url);
	obj.pathname = decodeURIComponent(obj.pathname);
	obj.search = decodeURIComponent(obj.search);
	return obj;
}

global.parseurlDecode = function (req) {
	let obj = global.parseurl(req);
	obj.query = global.querystring.parse(obj.query);
	obj.path = obj.href = decodeURIComponent(obj.href);
	obj.pathname = decodeURIComponent(obj.pathname);
	obj.search = decodeURIComponent(obj.search);
	return obj;
}

function bench(name, url, setup='') {
  global.url = url;
  const suite = new Suite();
  console.log(`\n# ${name} "${url}"`);
  suite.with = (x, y) => suite.add(x, y, { setup, minSamples:100 });
  suite.on('cycle', e => console.log('  ' + e.target));
  return suite;
}

bench('Parsing:', '/foo/bar?user=tj&pet=fluffy')
	.with('native      ', 'native.parse(url)')
	.with('parseurl    ', 'parseurl({ url })')
	.with('@polka/url  ', 'parse({ url })')
	.run();

bench('REPEAT:', '/foo/bar?user=tj&pet=fluffy', 'req = { url }')
	.with('native      ', 'native.parse(req.url)')
	.with('parseurl    ', 'parseurl(req)')
	.with('@polka/url  ', 'parse(req)')
	.run();

bench('Parsing:', '/foo/bar')
	.with('native      ', 'native.parse(url)')
	.with('parseurl    ', 'parseurl({ url })')
	.with('@polka/url  ', 'parse({ url })')
	.run();

bench('Parsing:', '/')
	.with('native      ', 'native.parse(url)')
	.with('parseurl    ', 'parseurl({ url })')
	.with('@polka/url  ', 'parse({ url })')
	.run();

bench('DECODE:', '/f%C3%B8%C3%B8%C3%9F%E2%88%82r')
	.with('native/bad#1', 'native.parse(url, true)') // wrong
	.with('native/bad#2', 'native.parse(decodeURIComponent(url), true)') // wrong
	.with('native      ', 'nativeDecode(url)')
	.with('parseurl    ', 'parseurlDecode({ url })')
	.with('@polka/url  ', 'parse({ url }, true)')
	.run();

bench('DECODE:', '/f%C3%B8%C3%B8%C3%9F%E2%88%82r?phone=%2b393383123549')
	.with('native/bad#1', 'native.parse(url, true)') // wrong
	.with('native/bad#2', 'native.parse(decodeURIComponent(url), true)') // wrong
	.with('native      ', 'nativeDecode(url)')
	.with('parseurl    ', 'parseurlDecode({ url })')
	.with('@polka/url  ', 'parse({ url }, true)')
	.run();

bench('DECODE:', '/foo/bar')
	.with('native/bad#1', 'native.parse(url, true)') // wrong
	.with('native/bad#2', 'native.parse(decodeURIComponent(url), true)') // wrong
	.with('native      ', 'nativeDecode(url)')
	.with('parseurl    ', 'parseurlDecode({ url })')
	.with('@polka/url  ', 'parse({ url }, true)')
	.run();
