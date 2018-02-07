# Example: Morgan logger

This example shows how to mount [`morgan`](https://www.npmjs.com/package/morgan) as a global logger within a Polka application.

Additionally, a sub-application is attached to the `/items` base path, illustrating that all routes & methods are recorded correctly!

## Setup

```sh
$ npm install
$ npm start
```

## Usage

Open a browser to `localhost:3000` or run the `curl` commands below.

> Check your Terminal for `morgan` output! :tada:

```sh
$ curl localhost:3000
#=> (200) Index

$ curl localhost:3000/items
#=> (200) items@index

$ curl localhost:3000/items/123
#=> (200) items@show(123)

$ curl localhost:3000/items -X POST
#=> (200) items@create

$ curl localhost:3000/items/123 -X PUT
#=> (200) items@update(123)

$ curl localhost:3000/items/123 -X DELETE
#=> (200) items@delete(123)

$ curl localhost:3000/foobar
#=> (404) Not Found
```
