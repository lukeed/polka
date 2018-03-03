# Example: GraphQL

Tiny example that exposes a [GraphQL](https://github.com/graphql/graphql-js) API via JSON queries.

It uses the popular [`body-parser`](https://github.com/expressjs/body-parser) middleware from Express to _parse_ the incoming body. As per the middleware behavior, an object is made available at the `req.body` location.

An inline `tasks` dataset is included for this example -- you wouldn't do this in a real project! :laughing:

> _Disclaimer:_ I don't actually use GraphQL, so am not sure if this is the best way to handle it in a Node.js server. <br>It seems to work just fine without a load of dependencies; however, there are many ways & tools available!

## Setup

```sh
$ npm install
$ npm start
```

## Usage

There is only one route (`POST /`) for the purpose of this demo.

```sh
$ curl localhost:3000
#=> (404) Not Found

$ curl localhost:3000 -d '{"query":"{ tasks { id, name, complete } }"}' -H "content-type: application/json"
#=> (200) {"data": {"tasks": [...] }}

$ curl localhost:3000 -d '{"query":"{ task(id:2) { name, complete } }"}' -H "content-type: application/json"
#=> (200) {"data":{"task":{"name":"Walk the dog","complete":true}}}
```
