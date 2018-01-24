# Example: Socket.io

This example is a simple chatroom application using Polka and [Socket.io](https://github.com/socketio/socket.io).

> Adapted from [Socket.IO Chat](https://github.com/socketio/socket.io/tree/master/examples/chat).

Socket.io listens to Polka's internal `http.Server` instance, injecting itself as a middelware.

Also, [`serve-static`](https://github.com/expressjs/serve-static) is used to send file assets from the `public` directory.

## Setup

```sh
$ npm install
$ npm start
```

## Usage

Open (multiple) browsers to `localhost:3000`!
