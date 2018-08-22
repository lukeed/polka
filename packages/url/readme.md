# @polka/url [![npm](https://badgen.now.sh/npm/v/@polka/url)](https://npmjs.org/package/@polka/url)

> Super fast, memoized `req.url` parser; _not_ limited to [Polka][polka]!

Parses the `url` from a [`IncomingMessage`](https://nodejs.org/api/http.html#http_class_http_incomingmessage) request.

If the `req.url` contains a hash (`#`) then the native [`url.parse`](https://nodejs.org/api/url.html#url_url_parse_urlstring_parsequerystring_slashesdenotehost) will be used, returning a complete [`Url`](https://nodejs.org/api/url.html#url_class_url).<br>Otherwise, the return object will only contain the following keys: `search`, `query`, `pathname`, `path`, `href`, and `_raw`.

> **Note:** This library does not process `protocol`, `hostname`, `port`, etc.<br>This is because the incoming `req.url` value only begins with the path information.

Parsed requests will be mutated with a `_parsedUrl` key, containing the returned output. This is used for future memoization, so as to avoid parsing the same `url` value multiple times.

## Install

```
$ npm install --save @polka/url
```

## Usage

```js
const parse = require('@polka/url');

let req = { url: '/foo/bar?fizz=buzz' };
let foo = parse(req);
//=> { search: '?fizz=buzz',
//=>   query: 'fizz=buzz',
//=>   pathname: '/foo/bar',
//=>   path: '/foo/bar?fizz=buzz',
//=>   href: '/foo/bar?fizz=buzz',
//=>   _raw: '/foo/bar?fizz=buzz' }

// Attaches result for future memoization
assert.deepEqual(foo, req._parsedUrl); //=> true

// Process a request w/ a hashtag
req = { url: '/foo/bar?fizz=buzz#hello' };
let bar = parse(req);
//=> Url {
//=>   protocol: null,
//=>   slashes: null,
//=>   auth: null,
//=>   host: null,
//=>   port: null,
//=>   hostname: null,
//=>   hash: '#hello',
//=>   search: '?fizz=buzz',
//=>   query: 'fizz=buzz',
//=>   pathname: '/foo/bar',
//=>   path: '/foo/bar?fizz=buzz',
//=>   href: '/foo/bar?fizz=buzz#hello',
//=>   _raw: '/foo/bar?fizz=buzz#hello' }

// Also attaches result for future memoization
assert.deepEqual(bar, req._parsedUrl); //=> true
```

## API

### url(req)
Returns: `Object` or `undefined`

> **Important:** The `req` must have a `url` key, otherwise `undefined` will be returned.<br>If no input is provided at all, a `TypeError` will be thrown.

#### req
Type: `IncomingMessage`

The incoming HTTP request (`req`).



## Support

Any issues or questions can be sent to the [Polka][polka] repo, but please specify that your inquiry is about `@polka/url` specifically.


## License

MIT © [Luke Edwards](https://lukeed.com)

[polka]: https://github.com/lukeed/polka
