# @polka/url [![npm](https://badgen.now.sh/npm/v/@polka/url)](https://npmjs.org/package/@polka/url)

> Super fast, memoized `req.url` parser; _not_ limited to [Polka][polka]!

Parses the `url` from a [`IncomingMessage`](https://nodejs.org/api/http.html#http_class_http_incomingmessage) request. The returned object will always only contain the following keys: `search`, `query`, `pathname`, and `raw`.

> **Note:** This library does not process `protocol`, `hostname`, `port`, etc.<br>This is because the incoming `req.url` value only begins with the path information.

Parsed requests will be mutated with a `_parsedUrl` key, containing the returned output. This is used for future memoization, avoiding the need to fully parse the same `url` value multiple times.

## Install

```
$ npm install --save @polka/url
```

## Usage

```js
const parse = require('@polka/url');

let req = {
  url: '/foo/bar?fizz=buzz'
};
let output = parse(req);
//=> {
//=>   pathname: '/foo/bar',
//=>   raw: '/foo/bar?fizz=buzz',
//=>   search: '?fizz=buzz',
//=>   query: {
//=>     fizz: 'buzz'
//=>   },
//=> }

// Attaches result for future memoization
assert.deepEqual(output, req._parsedUrl); //=> true

// Example with `toDecode` param
req = {
  url: '/f%C3%B8%C3%B8%C3%9F%E2%88%82r?phone=%2b8675309'
};
parse(req, true);
//=> {
//=>   pathname: '/føøß∂r',
//=>   raw: '/f%C3%B8%C3%B8%C3%9F%E2%88%82r?phone=%2b8675309',
//=>   search: '?phone=%2b8675309',
//=>   query: {
//=>     phone: '+8675309'
//=>   }
//=> }

// Attaches awareness key
assert(req._decoded); //=> true
```

## API

### url(req, toDecode?)
Returns: `Object` or `undefined`

> **Important:** The `req` must have a `url` key, otherwise `undefined` will be returned.<br>If no input is provided at all, a `TypeError` will be thrown.

#### req
Type: `IncomingMessage` or `{ url: string }`

The incoming HTTP request (`req`) or a plain `Object` with a `url` key.

> **Note:** In Node.js servers, the [`req.url`](https://nodejs.org/api/http.html#http_message_url) begins with a pathname & does not include a `hash`.

#### toDecode
Type: `Boolean`<br>
Default: `false`

If enabled, the `pathname` will be fully decoded, via [`decodeURIComponent`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/decodeURIComponent).

> **Important:** Please note the following behaviors:
> * `raw` is _never_ decoded; this key reflects your original value
> * `pathname` is decoded _only_ when `toDecode` is enabled
> * `search` is _never_ decoded; this key reflects your original querystring value
> * `query` is _always_ decoded; even when `toDecode` is disabled

Additionally, the `req` is mutated with `req._decoded = true` so as to prevent repetitive decoding.


## Benchmarks

Check out the [`bench`](/bench) directory for in-depth benchmark results and comparisons.


## Support

Any issues or questions can be sent to the [Polka][polka] repository.<br>However, please specify that your inquiry is about `@polka/url` specifically.


## License

MIT © [Luke Edwards](https://lukeed.com)

[polka]: https://github.com/lukeed/polka
