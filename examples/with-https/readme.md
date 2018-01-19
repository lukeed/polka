# Example: HTTPS

This example shows how to mount Polka inside a HTTPS server.

All requests are handled by Polka, echoing the `req.pathname` it received.

## Setup

```sh
$ npm install
# Import or Generate SSL keys
$ openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout ssl/foobar.key -out ssl/foobar.crt
$ npm start
```

> **Note:** You'll likely see a "Not Secure" warning &mdash; it's because of the fake certificate we just generated.

## Usage

```sh
$ curl -k https://localhost:3000
#=> (200) POLKA: Hello from /

$ curl -k https://localhost:3000/users/123
#=> (200) POLKA: Hello from /users/123
```
