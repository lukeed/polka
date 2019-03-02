# @polka/send-type [![npm](https://img.shields.io/npm/v/@polka/send-type.svg)](https://npmjs.org/package/@polka/send-type)

> An HTTP response helper that detects `Content-Type`s & handles them accordingly &mdash; _not_ limited to [Polka][polka]!

For a simpler, bare-bones alternative, check out [`@polka/send`][send] instead~


## Install

```
$ npm install --save @polka/send-type
```


## Usage

```js
const { createReadStream } = require('fs');
const send = require('@polka/send-type');

module.exports = function (req, res) {
  if (!req.getHeader('authorization')) {
    // Objects are converted to JSON
    return send(res, 401, { error:'Token required!' });
  }
  // Streams & Buffers are auto-piped
  // Your 'Content-Type' is always used,
  // ~> otherwise 'application/octet-stream'
  let file = createReadStream('massive.mp4');
  send(res, 206, file, { 'Content-Type': 'video/mp4' });
}
```


## API

### send(res, code, data, headers)

#### res
Type: `ServerReponse`

The outgoing HTTP response.

#### code
Type: `Number`<br>
Default: `200`

The `statusCode` for your response.

#### data
Type: `String`<br>
Default: `''`

The `body` for your response. Defaults to the `statusText` for the given `statusCode`.

See [Data Detections](#data-detections) for special behaviors.

#### headers
Type: `Object`<br>
Default: `{}`

The `headers` for your response.

The `Content-Type` header is a little unique – it will be set with the value you provide in `headers`. However, if you _did not_ set a value explicitly, then `send-type` will reuse the existing value via [`res.getHeader`](https://nodejs.org/api/http.html#http_response_getheader_name).<br>If neither existed, then the `Content-Type` will be inferred by the data type.

See [Data Detections](#data-detections) for special behaviors.


## Data Detections

The following operations will be performed for the following data types:

> **Important:** If this is too much magic for you, check out [`@polka/send`][send] instead!

### Buffers
- Sets `Content-Type` to `'application/octet-stream'`, unless one exists in [`headers`](#headers)
- Sets `Content-Length`

### Objects
- Casts [`data`](#data) to string via `JSON.stringify`
- Sets `Content-Type` to `'application/json; charset=utf-8'`, unless one exists in [`headers`](#headers)
- Sets `Content-Length`

### Streams
- Sets `Content-Type` to `'application/octet-stream'`, unless one exists in [`headers`](#headers)
- Pipes [`data`](#data) into the [`res`](#res) directly


## Support

Any issues or questions can be sent to the [Polka][polka] repo, but please specify that you are using `@polka/send-type`.


## License

MIT © [Luke Edwards](https://lukeed.com)

[polka]: https://github.com/lukeed/polka
[send]: https://github.com/lukeed/polka/tree/master/packages/send
