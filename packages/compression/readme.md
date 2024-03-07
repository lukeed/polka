# @polka/compression [![npm](https://badgen.now.sh/npm/v/@polka/compression)](https://npmjs.org/package/@polka/compression) [![licenses](https://licenses.dev/b/npm/%40polka%2Fcompression)](https://licenses.dev/npm/%40polka%2Fcompression)

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

### `compression(options?: Options): Middlware`

The `compression` function creates a Polka/Express-compatible middleware function. When no [`options`](#options) are defined, the defaults are used.


## Options

All options use a default value when a value is not defined.

#### options.threshold
Type: `Number`<br>
Default: `1024`

Responses below this threshold (in bytes) are not compressed. The default value of `1024` is recommended, and avoids sharply diminishing compression returns.

#### options.level
Type: `Number`<br>
Default: `-1`

The compression effort/level/quality setting, used by both Gzip and Brotli. The scale ranges from `1` to `11`, where lower values are faster and higher values produce smaller output.

The default value of `-1` uses the default compression level as defined by Gzip (`6`) and Brotli (`6`).

#### options.brotli
Type: `boolean`<br>
Default: `false`

Enables response compression using Brotli for requests that support it.

Brotli incurs more performance overhead than Gzip, which is why it's not enabled by default.

#### options.gzip
Type: `boolean`<br>
Default: `true`

Enables response compression using Gzip for requests that support it, as determined by the `Accept-Encoding` request header.

#### options.mimes
Type: `RegExp`<br>
Default: `/text|javascript|\/json|xml/i`

The `Content-Type` response header is evaluated against this Regular Expression to determine if it is a MIME type that should be compressed.

> **NOTE:** Remember that compression is (generally) only effective on textual content.


## Support

Any issues or questions can be sent to the [Polka][polka] repository.<br>However, please specify that your inquiry is about `@polka/compression` specifically.


## License

MIT

[polka]: https://github.com/lukeed/polka
