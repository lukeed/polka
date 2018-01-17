# Example: Body Parser

Tiny example that echoes the JSON that it received.

It uses the popular [`body-parser`](https://github.com/expressjs/body-parser) middleware from Express to _parse_ the incoming body. As per the middleware behavior, an object is made available at the `req.body` location.

## Setup

```sh
$ npm install
$ npm start
```

## Usage

There is only one route (`POST /`) for the purpose of this demo.

```sh
$ curl localhost:3000
#=> (501) Not Implemented

$ curl localhost:3000 -X POST -d '{"hello":"world"}'
#=> (200) {}

$ curl localhost:3000 -X POST -d '{"hello":"world"}' -H "content-type: application/json"
#=> (200) {"hello":"world"}
```
