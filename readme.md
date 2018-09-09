<div align="center">
  <img src="https://github.com/lukeed/polka/raw/master/polka.png" alt="Polka" width="400" height="300" />
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

Polka is an extremely minimal, highly performant Express.js alternative. Yes, you're right, Express is _already_ super fast & not _that_ big :thinking: &mdash; but Polka shows that there was (somehow) room for improvement!

Essentially, Polka is just a [native HTTP server](https://nodejs.org/dist/latest-v9.x/docs/api/http.html#http_class_http_server) with added support for routing, middleware, and sub-applications. That's it! :tada:

And, of course, in mandatory bullet-point format:

* 33-50% faster than Express for simple applications
* Middleware support, including Express middleware you already know & love
* Nearly identical application API & route pattern definitions
* ~90 LOC for Polka, 120 including [its router](https://github.com/lukeed/trouter)


## Install

```
$ npm install --save polka
```

## Usage

```js
const polka = require('polka');

function one(req, res, next) {
  req.hello = 'world';
  next();
}

function two(req, res, next) {
  req.foo = '...needs better demo 😔';
  next();
}

polka()
  .use(one, two)
  .get('/users/:id', (req, res) => {
    console.log(`~> Hello, ${req.hello}`);
    res.end(`User: ${req.params.id}`);
  })
  .listen(3000).then(_ => {
    console.log(`> Running on localhost:3000`);
  });
```

## API

Polka extends [Trouter](https://github.com/lukeed/trouter) which means it inherits its API, too!

### polka(options)

Returns an instance of Polka~!

#### options.server
Type: `Server`<br>

A custom, instantiated server that the Polka instance should attach its [`handler`](#handlerreq-res-parsed) to. This is useful if you have initialized a server elsewhere in your application and want Polka to use _it_ instead of creating a new `http.Server`.

Polka _only_ updates the server when [`polka.listen`](#listenport-hostname) is called. At this time, Polka will create a [`http.Server`](https://nodejs.org/api/http.html#http_class_http_server) if a server was not provided via `options.server`.

> **Important:** The `server` key will be `undefined` until `polka.listen` is invoked, unless a server was provided.

#### options.onError
Type: `Function`

A catch-all error handler; executed whenever a middleware throws an error. Change this if you don't like default behavior.

Its signature is `(err, req, res, next)`, where `err` is the `String` or `Error` thrown by your middleware.

> **Caution:** Use `next()` to bypass certain errors **at your own risk!** <br>You must be certain that the exception will be handled elsewhere or _can_ be safely ignored. <br>Otherwise your response will never terminate!

#### options.onNoMatch
Type: `Function`

A handler when no route definitions were matched. Change this if you don't like default behavior, which sends a `404` status & `Not found` response.

Its signature is `(req, res)` and requires that you terminate the response.


### use(base, ...fn)

Attach [middleware(s)](#middleware) and/or sub-application(s) to the server. These will execute _before_ your routes' [handlers](#handlers).

**Important:** If a `base` pathname is provided, all functions within the same `use()` block will _only_ execute when the `req.path` matches the `base` path.

#### base
Type: `String`<br>
Default: `undefined`

The base path on which the following middleware(s) or sub-application should be mounted.

#### fn
Type: `Function|Array`

You may pass one or more functions at a time. Each function must have the standardized `(req, res, next)` signature.

You may also pass a sub-application, which _must_ be accompanied by a `base` pathname.

Please see [`Middleware`](#middleware) and [Express' middleware examples](http://expressjs.com/en/4x/api.html#middleware-callback-function-examples) for more info.


### parse(req)

Returns: `Object`

This is an alias of the awesome [`parseurl`](https://github.com/pillarjs/parseurl#api) module. There are no Polka-specific changes.

### listen(port, hostname)

Returns: `Promise`

Wraps the native [`server.listen`](https://nodejs.org/dist/latest-v9.x/docs/api/http.html#http_server_listen) with a Promise, rejecting on any error.

### handler(req, res, parsed)

The main Polka [`IncomingMessage`](https://nodejs.org/api/http.html#http_class_http_incomingmessage) handler. It receives all requests and tries to match the incoming URL against known routes.

If the `req.url` is not immediately matched, Polka will look for sub-applications or middleware groups matching the `req.url`'s [`base`](#base) path. If any are found, they are appended to the loop, running _after_ any global middleware.

> **Note:** Any middleware defined within a sub-application is run _after_ the main app's (aka, global) middleware and _before_ the sub-application's route handler.

At the end of the loop, if a middleware hasn't yet terminated the response (or thrown an error), the route handler will be executed, if found &mdash; otherwise a `(404) Not found` response is returned, configurable via [`options.onNoMatch`](#optionsonnomatch).

#### req
Type: `IncomingMessage`

#### res
Type: `ServerResponse`

#### parsed
Type: `Object`

Optionally provide a parsed [URL](https://nodejs.org/dist/latest-v9.x/docs/api/url.html#url_class_url) object. Useful if you've already parsed the incoming path. Otherwise, [`app.parse`](#parsereq) (aka [`parseurl`](https://github.com/pillarjs/parseurl)) will run by default.


## Routing

Routes are used to define how an application responds to varying HTTP methods and endpoints.

> If you're coming from Express, there's nothing new here!<br> However, do check out [Comparisons](#comparisons) for some pattern changes.

### Basics

Each route is comprised of a [path pattern](#patterns), a [HTTP method](#methods), and a [handler](#handlers) (aka, what you want to do).

In code, this looks like:

```js
app.METHOD(pattern, handler);
```

wherein:

* `app` is an instance of `polka`
* [`METHOD`](#methods) is any valid HTTP method, lowercased
* [`pattern`](#patterns) is a routing pattern (string)
* [`handler`](#handlers) is the function to execute when `pattern` is matched

Also, a single pathname (or `pattern`) may be reused with multiple METHODs.

The following example demonstrates some simple routes.

```js
const app = polka();

app.get('/', (req, res) => {
  res.end('Hello world!');
});

app.get('/users', (req, res) => {
  res.end('Get all users!');
});

app.post('/users', (req, res) => {
  res.end('Create a new User!');
});

app.put('/users/:id', (req, res) => {
  res.end(`Update User with ID of ${req.params.id}`);
});

app.delete('/users/:id', (req, res) => {
  res.end(`CY@ User ${req.params.id}!`);
});
```

### Patterns

Unlike the very popular [`path-to-regexp`](https://github.com/pillarjs/path-to-regexp), Polka uses string comparison to locate route matches. While [faster](https://github.com/lukeed/matchit#benchmarks) & more memory efficient, this does also prevent complex pattern matching.

However, have no fear! :boom: All the basic and most commonly used patterns are supported. You probably only ever used these patterns in the first place. :wink:

> See [Comparisons](#comparisons) for the list of `RegExp`-based patterns that Polka does not support.

The supported pattern types are:

* static (`/users`)
* named parameters (`/users/:id`)
* nested parameters (`/users/:id/books/:title`)
* optional parameters (`/users/:id?/books/:title?`)
* any match / wildcards (`/users/*`)

### Parameters

Any named parameters included within your route [`pattern`](#patterns) will be automatically added to your incoming `req` object. All parameters will be found within `req.params` under the same name they were given.

> **Important:** Your parameter names should be unique, as shared names will overwrite each other!

```js
app.get('/users/:id/books/:title', (req, res) => {
  let { id, title } = req.params;
  res.end(`User: ${id} && Book: ${title}`);
});
```

```sh
$ curl /users/123/books/Narnia
#=> User: 123 && Book: Narnia
```

### Methods

Any valid HTTP method is supported! However, only the most common methods are used throughout this documentation for demo purposes.

> **Note:** For a full list of valid METHODs, please see [this list](http://expressjs.com/en/4x/api.html#routing-methods).

### Handlers

Request handlers accept the incoming [`IncomingMessage`](https://nodejs.org/api/http.html#http_class_http_incomingmessage) and the formulating [`ServerResponse`](https://nodejs.org/dist/latest-v9.x/docs/api/http.html#http_class_http_serverresponse).

Every route definition must contain a valid `handler` function, or else an error will be thrown at runtime.

> **Important:** You must _always_ terminate a `ServerResponse`!

It's a **very good** practice to _always_ terminate your response ([`res.end`](https://nodejs.org/api/http.html#http_request_end_data_encoding_callback)) inside a handler, even if you expect a [middleware](#middleware) to do it for you. In the event a response is/was not terminated, the server will hang & eventually exit with a `TIMEOUT` error.

> **Note:** This is a native `http` behavior.

#### Async Handlers

If using Node 7.4 or later, you may leverage native `async` and `await` syntax! :heart_eyes_cat:

No special preparation is needed &mdash; simply add the appropriate keywords.

```js
const app = polka();

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function authenticate(req, res, next) {
  let token = req.headers['authorization'];
  if (!token) return (res.statusCode=401,res.end('No token!'));
  req.user = await Users.find(token); // <== fake
  next(); // done, woot!
}

app
  .use(authenticate)
  .get('/', async (req, res) => {
    // log middleware's findings
    console.log('~> current user', req.user);
    // force sleep, because we can~!
    await sleep(500);
    // send greeting
    res.end(`Hello, ${req.user.name}`);
  });
```


## Middleware

Middleware are functions that run in between (hence "middle") receiving the request & executing your route's [`handler`](#handlers) response.

> Coming from Express? Use any middleware you already know & love! :tada:

The middleware signature receives the request (`req`), the response (`res`), and a callback (`next`).

These can apply mutations to the `req` and `res` objects, and unlike Express, have access to `req.params`, `req.path`, `req.search`, and `req.query`!

Most importantly, a middleware ***must*** either call `next()` or terminate the response (`res.end`). Failure to do this will result in a never-ending response, which will eventually crash the `http.Server`.

```js
// Log every request
function logger(req, res, next) {
  console.log(`~> Received ${req.method} on ${req.url}`);
  next(); // move on
}

function authorize(req, res, next) {
  // mutate req; available later
  req.token = req.headers['authorization'];
  req.token ? next() : ((res.statusCode=401) && res.end('No token!'));
}

polka().use(logger, authorize).get('*', (req, res) => {
  console.log(`~> user token: ${req.token}`);
  res.end('Hello, valid user');
});
```

```sh
$ curl /
# ~> Received GET on /
#=> (401) No token!

$ curl -H "authorization: secret" /foobar
# ~> Received GET on /foobar
# ~> user token: secret
#=> (200) Hello, valid user
```

In Polka, middleware functions are mounted globally, which means that they'll run on every request (see [Comparisons](#comparisons)). Instead, you'll have to apply internal filters to determine when & where your middleware should run.

> **Note:** This might change in Polka 1.0 :thinking:

```js
function foobar(req, res, next) {
  if (req.path.startsWith('/users')) {
    // do something magical
  }
  next();
}
```

### Middleware Errors

If an error arises within a middleware, the loop will be exited. This means that no other middleware will execute & neither will the route handler.

Similarly, regardless of `statusCode`, an early response termination will also exit the loop & prevent the route handler from running.

There are three ways to "throw" an error from within a middleware function.

> **Hint:** None of them use `throw` :joy_cat:

1. **Pass any string to `next()`**

    This will exit the loop & send a `500` status code, with your error string as the response body.

    ```js
    polka()
      .use((req, res, next) => next('💩'))
      .get('*', (req, res) => res.end('wont run'));
    ```

    ```sh
    $ curl /
    #=> (500) 💩
    ```

2. **Pass an `Error` to `next()`**

    This is similar to the above option, but gives you a window in changing the `statusCode` to something other than the `500` default.

    ```js
    function oopsies(req, res, next) {
      let err = new Error('Try again');
      err.code = 422;
      next(err);
    }
    ```

    ```sh
    $ curl /
    #=> (422) Try again
    ```

3. **Terminate the response early**

    Once the response has been ended, there's no reason to continue the loop!

    This approach is the most versatile as it allows to control every aspect of the outgoing `res`.

    ```js
    function oopsies(req, res, next) {
      if (true) {
        // something bad happened~
        res.writeHead(400, {
          'Content-Type': 'application/json',
          'X-Error-Code': 'Please dont do this IRL'
        });
        let json = JSON.stringify({ error:'Missing CSRF token' });
        res.end(json);
      } else {
        next(); // never called FYI
      }
    }
    ```

    ```sh
    $ curl /
    #=> (400) {"error":"Missing CSRF token"}
    ```


## Benchmarks

Quick comparison between various frameworks using [`wrk`](https://github.com/wg/wrk) on `Node v10.4.0`.<br> Results are taken with the following command, after one warm-up run:

```
$ wrk -t4 -c4 -d10s http://localhost:3000/users/123
```

Additional benchmarks between Polka and Express (using various Node versions) can be [found here](/bench).

> **Important:** Time is mostly spent in _your application code_ rather than Express or Polka code!<br> Switching from Express to Polka will (likely) not show such drastic performance gains.

```
Native
    Thread Stats   Avg      Stdev     Max   +/- Stdev
        Latency    80.82us   37.10us   1.08ms   87.61%
        Req/Sec    12.22k     2.83k   16.70k    56.93%
      491258 requests in 10.10s, 48.72MB read
    Requests/sec:  48640.61
    Transfer/sec:      4.82MB

Polka
    Thread Stats   Avg      Stdev     Max   +/- Stdev
        Latency    81.03us   36.72us   1.10ms   83.89%
        Req/Sec    12.18k     3.02k   16.57k    50.00%
      489630 requests in 10.10s, 48.56MB read
    Requests/sec:  48478.90
    Transfer/sec:      4.81MB

Rayo
    Thread Stats   Avg      Stdev     Max   +/- Stdev
        Latency    84.09us   38.08us   1.04ms   87.26%
        Req/Sec    11.75k     3.19k   16.16k    40.59%
      472256 requests in 10.10s, 46.84MB read
    Requests/sec:  46761.11
    Transfer/sec:      4.64MB

Fastify
    Thread Stats   Avg      Stdev     Max   +/- Stdev
        Latency    90.56us   42.47us   1.61ms   91.22%
        Req/Sec    10.93k     3.13k   15.11k    33.42%
      439399 requests in 10.10s, 60.76MB read
    Requests/sec:  43505.05
    Transfer/sec:      6.02MB

Koa
    Thread Stats   Avg      Stdev     Max   +/- Stdev
        Latency   127.33us   54.31us   1.19ms   84.59%
        Req/Sec     7.80k     2.48k   10.95k    37.38%
      313672 requests in 10.10s, 43.38MB read
    Requests/sec:  31057.11
    Transfer/sec:      4.29MB

Express
    Thread Stats   Avg      Stdev     Max   +/- Stdev
        Latency   161.92us   70.36us   2.50ms   86.97%
        Req/Sec     6.16k     1.93k    8.81k    42.82%
      247613 requests in 10.10s, 34.00MB read
    Requests/sec:  24516.23
    Transfer/sec:      3.37MB
```


## Comparisons

Polka's API aims to be _very_ similar to Express since most Node.js developers are already familiar with it. If you know Express, you already know Polka! :dancer:

There are, however, a few main differences. Polka does not support or offer:

1) **Any built-in view/rendering engines.**

    Most templating engines can be incorporated into middleware functions or used directly within a route handler.

2) **The ability to `throw` from within middleware.**

    However, all other forms of middleware-errors are supported. (See [Middleware Errors](#middleware-errors).)

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

3) **Express-like response helpers... yet! (#14)**

    Express has a nice set of [response helpers](http://expressjs.com/en/4x/api.html#res.append). While Polka relies on the [native Node.js response methods](https://nodejs.org/dist/latest-v9.x/docs/api/http.html#http_class_http_serverresponse), it would be very easy/possible to attach a global middleware that contained a similar set of helpers. (_TODO_)

4) **`RegExp`-based route patterns.**

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


## License

MIT © [Luke Edwards](https://lukeed.com)
