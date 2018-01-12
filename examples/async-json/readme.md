# Example: Async

> **WARNING** This will only work with Node 7.4 or later!

This example makes use of Node's built-in `async`/`await` &mdash; no compiling required!

It forwards all requests to [HNPWA's JSON API](https://hnpwa.com/), utilizing [`node-fetch`](https://github.com/bitinn/node-fetch) for the server-side requests.

## Setup

```sh
$ npm install
$ npm start
```

## Usage

There are only a few valid paths: `/`, `/news`, `/newest`, `/jobs`, `/ask`, and `/show`.

Anything else will return `(404) Not Found`.

```sh
$ curl localhost:3000
#=> (200) JSON
$ curl localhost:3000/news
#=> (200) JSON
$ curl localhost:3000/foobar
#=> 404 Not Found
```
