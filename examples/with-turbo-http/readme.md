# Example: turbo-http

This example shows how to use Polka with the [`turbo-http`](https://github.com/mafintosh/turbo-http) HTTP server.

Just like the [HTTPS example](https://github.com/lukeed/polka/tree/master/examples/with-https), Polka's app `handler` is embedded within a custom server implementation.

## Setup

```sh
$ npm install
$ npm start
```

## Usage

Only the `/` route is specified.

```sh
$ curl localhost:3000
#=> (200) Hello

$ curl localhost:3000/foobar
#=> (404) Not Found
```

## Benchmarks

```
Thread Stats   Avg      Stdev     Max   +/- Stdev
    Latency     1.31ms  341.42us   5.06ms   79.27%
    Req/Sec     8.38k     1.16k   19.57k    85.61%
  672766 requests in 10.10s, 42.99MB read
  Socket errors: connect 0, read 226, write 0, timeout 0
Requests/sec:  66594.54
Transfer/sec:      4.26MB
```
