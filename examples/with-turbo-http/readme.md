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
//
```
