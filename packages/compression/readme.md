# @polka/compression [![npm](https://badgen.now.sh/npm/v/@polka/compression)](https://npmjs.org/package/@polka/compression)

> An HTTP response compression middleware that supports native Gzip and Brotli. Works with [Polka][polka] and Express!


## Install

```
$ npm install --save @polka/compression
```


## Usage

```js
const polka = require('polka');
const compression = require('@polka/compression');

polka()
  .use(compression({ /* see options below */ }))
  .use((req, res) => {
    // this will get compressed:
    res.end('hello world!'.repeat(1000));
  })
  .listen();
```


## API

The `compression(options)` function returns a polka/express -style middleware of the form `(req, res, next)`.

### Options

 * @param {number} [options.threshold = 1024] Don't compress responses below this size (in bytes)
 * @param {number} [options.level = -1] Gzip/Brotli compression effort (1-11, or -1 for default)
 * @param {boolean} [options.brotli = false] Generate and serve Brotli-compressed responses
 * @param {boolean} [options.gzip = true] Generate and serve Gzip-compressed responses
 * @param {RegExp} [options.mimes] Regular expression of response MIME types to compress (default: text|javascript|json|xml)

#### threshold
Type: `Number`<br>
Default: `1024`

Responses below this threshold (in bytes) are not compressed. The default value of `1024` is recommended, and avoids sharply diminishing compression returns.

#### level
Type: `Number`<br>
Default: `-1`

The compression effort/level/quality setting, used by both Gzip and Brotli. The scale ranges from 1 to 11, where lower values are faster and higher values produce smaller output. The default value of `-1` uses the default compression level as defined by Gzip (6) and Brotli (6).

#### brotli
Type: `boolean`<br>
Default: `false`

Enables response compression using Brotli for requests that support it. This is not enabled by default because Brotli incurs more performance overhead than Gzip.

#### gzip
Type: `boolean`<br>
Default: `true`

Enables response compression using Gzip for requests that support it, as determined by the `Accept-Encoding` request header.

#### mimes
Type: `RegExp`<br>
Default: `/text|javascript|\/json|xml/i`

The `Content-Type` response header is evaluated against this Regular Expression to determine if it is a MIME type that should be compressed.
Remember that compression is generally only effective on textual content.


## Support

Any issues or questions can be sent to the [Polka][polka] repo, but please specify that you are using `@polka/compression`.


## License

MIT

[polka]: https://github.com/lukeed/polka
