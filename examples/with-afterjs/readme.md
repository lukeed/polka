# Example: Razzle + After.js

> Ported from Razzle's [`examples/with-afterjs`](https://github.com/jaredpalmer/razzle/tree/master/examples/with-afterjs) &mdash; _nearly_ identical!

This example combines Polka with [Razzle](https://github.com/jaredpalmer/razzle) and [After.js](https://github.com/jaredpalmer/after.js), creating a robust & performant server-rendered React application.

Setup includes a production build, a production server, and live-reload [HMR](https://webpack.js.org/concepts/hot-module-replacement/) for _both_ client and server! :tada:

## Setup

```sh
$ npm install
# develop / HMR
$ npm start
# production
$ npm run build
$ npm run start:prod
```

## Usage

Open a browser to `localhost:3000`!

To use the built-in live-reload / HMR development server, run:

```sh
$ npm start
```

> The dev-server also runs on Polka! :dancers:
