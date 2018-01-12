# Example: Sub-Application

This example mounts a `/users` sub-application onto the "main" application.

## Setup

```sh
$ npm install
$ npm start
```

## Usage

```sh
$ curl localhost:3000
#=> (200) Main: Hello from GET /

$ curl localhost:3000/about
#=> (200) Main: Hello from GET /about

$ curl localhost:3000/users
#=> (200) Sub: Howdy from GET /users

$ curl localhost:3000/users/123
#=> (200) Sub: Howdy from GET /users/123

$ curl -X PUT localhost:3000/users/123
#=> (201) Sub: Updated user via PUT /users/123
```
