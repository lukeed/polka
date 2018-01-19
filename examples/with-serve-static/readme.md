# Example: Serve Static

Tiny example that illustrates how to use the popular [`serve-static`](https://github.com/expressjs/serve-static) middleware from Express.

The `public` directory (configurable) contents are served by Polka as static assets.

All photos are fetched from [Unsplash](https://unsplash.com) via the `public/app.js` script.

> **Note:** Polka (currently) uses a workaround to accomodate the middleware. <br>This will likely change before 1.0! This example will be udpated at such time~

## Setup

```sh
$ npm install
$ npm start
```

## Usage

Open a browser to `localhost:3000`!
