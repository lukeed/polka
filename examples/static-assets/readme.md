# Example: Static assets

This example mounts a `./static` folder as a static assets for the application.

## Setup

```sh
$ npm install
$ npm start
```

## Usage

There are only a few valid paths: `/`, `/polka.png` and `/test.txt`.

Anything else will return `(404) Not Found`.

```sh
$ curl localhost:3000
#=> hello world
$ curl localhost:3000/polka.png
#=> (200) polka.png image
$ curl localhost:3000/test.txt
#=> (200) hello, I am test txt
```
