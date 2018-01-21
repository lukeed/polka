# @polka/send [![npm](https://img.shields.io/npm/v/@polka/send.svg)](https://npmjs.org/package/@polka/send)

> An extremely simple HTTP Response helper &mdash; _not_ limited to [Polka][polka]!

:sparkles: For a more "magical" helper, check out [`@polka/send-type`][send-type] instead~

## Install

```
$ npm install --save @polka/send
```

## Usage

```js
const send = require('@polka/send');

module.exports = function (req, res, next) {
  if (!req.getHeader('authorization')) {
    return send(res, 401, 'Token required!');
  }
  next();
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

> **Important:** You are responsible for ensure your `data` is a string! <br>For inferred `Content-Type`s and response-casting, check out [`@polka/send-type`][send-type] instead!

#### headers
Type: `Object`<br>
Default: `{}`

The `headers` for your response.


## Support

Any issues or questions can be sent to the [Polka][polka] repo, but please specify that you are using `@polka/send`.


## License

MIT © [Luke Edwards](https://lukeed.com)

[polka]: https://github.com/lukeed/polka
[send-type]: https://github.com/lukeed/polka/tree/master/packages/send-type
