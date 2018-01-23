# Example: µWebSockets

This example shows how to use Polka with the [µWebSockets](https://github.com/uNetworking/uWebSockets) binding for Node.js, [`uws`](https://github.com/uNetworking/bindings/tree/master/nodejs).

Just like the [HTTPS example](https://github.com/lukeed/polka/tree/master/examples/with-https), Polka's app `handler` is embedded within a custom server implementation.

Because `uws` uses its own HTTP server (instead of the native `http.Server`), your request throughput is doubled! Checkout the [Benchmarks](#benchmarks) below!

## Setup

```sh
$ npm install
$ npm start
```

> **Note:** You'll likely see a "Not Secure" warning &mdash; it's because of the fake certificate we just generated.

## Usage

Only the `/` route is specified.

```sh
$ curl localhost:3000
#=> (200) Hello

$ curl localhost:3000/foobar
#=> (404) Not Found
```

## Benchmarks

Because of `uws`, latency is halved and the requests-per-second throughput is doubled!

In this configuration, Polka acts purely as a router. It passes off the request as quickly as it can, letting the server flex its muscle~!

```
Polka + Native Server
    Thread Stats   Avg      Stdev     Max   +/- Stdev
        Latency     2.26ms  115.55us   5.19ms   87.16%
        Req/Sec     5.32k    97.34     5.55k    72.77%
      428208 requests in 10.10s, 42.47MB read
    Requests/sec:  42388.92
    Transfer/sec:      4.20MB

Polka + uWebSockets Server
    Thread Stats   Avg      Stdev     Max   +/- Stdev
        Latency     1.17ms   64.65us   4.17ms   92.82%
        Req/Sec    10.25k   112.98    10.44k    85.77%
      824096 requests in 10.10s, 33.79MB read
    Requests/sec:  81594.48
    Transfer/sec:      3.35M
```
