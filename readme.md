<div align="center">
  <img src="/polka.png" alt="Polka" width="400" height="300" />
</div>

<h1 align="center">Polka</h1>

<div align="center">
  <a href="https://npmjs.org/package/polka">
    <img src="https://img.shields.io/npm/v/polka.svg" alt="version" />
  </a>
  <a href="https://travis-ci.org/lukeed/polka">
    <img src="https://img.shields.io/travis/lukeed/polka.svg" alt="travis" />
  </a>
  <a href="https://npmjs.org/package/polka">
    <img src="https://img.shields.io/npm/dm/polka.svg" alt="downloads" />
  </a>
</div>

<div align="center">A micro web server so fast, it'll make you dance! :dancers:</div>

<br />

Polka is an extremely minimal, highly performant Express.js alternative. Yes, you're right, Express is _already_ super fast & not _that_ big :thinking: --- but Polka shows that there was (somehow) room for improvement!

Essentially, Polka is just a [native HTTP server](https://nodejs.org/dist/latest-v9.x/docs/api/http.html#http_class_http_server) with added support for routing, middlewares, and sub-applications (TODO). That's it! :tada:

And, of course, in mandatory bullet-point format:

* 33-50% faster than Express for simple applications
* Middleware support, including Express middleware you already know & love
* Nearly identical application API & route pattern definitions
* 70 LOC for Polka, 105 including [its router](https://github.com/lukeed/trouter)


## Install

```
$ npm install --save polka
```

## Usage

```js
const polka = require('polka');

polka()
  .use(one, two)
  .get('/users/:id', (req, res) => {
    res.end(`User: ${req.params.id}`);
  })
  .listen(3000);
```

## API

### use(...fn)

Attach middleware(s) and/or sub-application(s) (TODO) to the server. These will execute _before_ your routes' handlers.

#### fn
Type: `Function|Array`

You may pass one or more function(s) at a time. Each function must have the standardized `(req, res, next)` signature.

Please see [`handler`](#handler) and [Express' middleware examples](http://expressjs.com/en/4x/api.html#middleware-callback-function-examples) for more info.

### parse(req)

Returns: `Object`

This is an alias of the awesome [`parseurl`](https://github.com/pillarjs/parseurl#api) module. There are no Polka-specific changes.

### start(port, hostname)

Returns: `Promise`

Wraps the native [`server.listen`](https://nodejs.org/dist/latest-v9.x/docs/api/http.html#http_server_listen) with a Promise, rejecting on any error.

### listen(port, hostname)

Returns: `Promise`

This is an alias of [`start`](#start).

### send(res, code, body, type)

A minimal helper that terminates the [`ServerResponse`](https://nodejs.org/dist/latest-v9.x/docs/api/http.html#http_class_http_serverresponse) with desired values.

#### res
Type: `ServerResponse`

#### code
Type: `Number`<br>
Default: `200`

#### body
Type: `String`<br>
Default: `http.STATUS_CODES[code]`

Returns the default `statusText` for a given [`code`](#code).

#### type
Type: `String`<br>
Default: 'text/plain'

The `Content-Type` header value for the response.

### handler(req, res, next)

The main Polka [`ClientRequest`](https://nodejs.org/dist/latest-v9.x/docs/api/http.html#http_class_http_clientrequest) handler. It receives all requests and tries to match the incoming URL against known routes.

If the `req.url` is not matched, a `(501) Not Implemented` response is returned. Otherwise, all middlewares will be called & then, finally, the route handler (user-defined) will be called --- assuming that a middleware hasn't already returned a response or thrown an error!

#### req
Type: `ClientRequest`

#### res
Type: `ServerResponse`

#### next
Type: `Function`

An optional function (with the same signature) to call at the end of the response cycle.


## Benchmarks

A round of Polka-vs-Express benchmarks across varying Node versions can be [found here](/bench).

> **Important:** Time is mostly spent in _your application code_ rather than Express or Polka code!<br> Switching from Express to Polka will (likely) not show such drastic performance gains.

```
# Node v9.1.0

#=> POLKA
Thread Stats   Avg      Stdev     Max   +/- Stdev
    Latency     2.34ms  198.33us   8.98ms   92.70%
    Req/Sec     5.15k   152.73     6.93k    85.70%
  1233025 requests in 30.10s, 127.00MB read
Requests/sec:  40962.46
Transfer/sec:      4.22MB

#=> EXPRESS
Thread Stats   Avg      Stdev     Max   +/- Stdev
    Latency     3.22ms  406.21us  10.57ms   92.21%
    Req/Sec     3.87k   248.19    10.42k    98.00%
  924698 requests in 30.10s, 115.52MB read
Requests/sec:  30716.24
Transfer/sec:      3.84MB
```


## Comparisons

Polka's API aims to be _very_ similar to Express since most Node.js developers are already familiar with it. If you know Express, you already know Polka! :dancer:

There are, however, a few main differences. Polka does not support or offer:

1) Any built-in view/rendering engines.

    Most templating engines can be incorporated into middleware functions or used directly within route handler.

2) The ability to `throw new Error`s from within middleware.

    However, all other forms of middleware-errors are supported.

    ```js
    function middleware(res, res, next) {
      // pass an error message to next()
      next('uh oh');

      // pass an Error to next()
      next(new Error('🙀'));

      // send an early, customized error response
      res.statusCode = 401;
      res.end('Who are you?');
    }
    ```

3) Response helpers... yet!

    Express has a nice set of [response helpers](http://expressjs.com/en/4x/api.html#res.append). While Polka relies on the [native Node.js response methods](https://nodejs.org/dist/latest-v9.x/docs/api/http.html#http_class_http_serverresponse), it would be very easy/possible to attach a global middleware that contained a similar set of helpers. (TODO)

4) The `.use()` method does not accept a `pathname` filter.

5) `RegExp`-based route patterns.

    Polka's router uses string comparison to match paths against patterns. It's a lot quicker & more efficient.

    The following routing patterns **are not** supported:

    ```js
    app.get('/ab?cd', _ => {});
    app.get('/ab+cd', _ => {});
    app.get('/ab*cd', _ => {});
    app.get('/ab(cd)?e', _ => {});
    app.get(/a/, _ => {});
    app.get(/.*fly$/, _ => {});
    ```

    The following routing patterns **are** supported:

    ```js
    app.get('/users', _ => {});
    app.get('/users/:id', _ => {});
    app.get('/users/:id?', _ => {});
    app.get('/users/:id/books/:title', _ => {});
    app.get('/users/*', _ => {});
    ```

6) Sub-applications...yet! (TODO 1.0)


## License

MIT © [Luke Edwards](https://lukeed.com)
