# polka [![Build Status](https://travis-ci.org/lukeed/polka.svg?branch=master)](https://travis-ci.org/lukeed/polka)

> A web microframework so fast, it'll make you dance! :dancers:

## Install

```
$ npm install --save polka
```

## Usage

```js
const polka = require('polka');

polka()
  .use(one, two)
  .get('/favicon.ico', _ => {})
  .get('/user/:id', (req, res) => {
    res.end(`User: ${req.params.id}`);
  })
  .listen(3000);
```

## API

~> ...

## Benchmarks

> Note, grain of salt. App code is slowest component, etc

~> ...

## Comparisons

~> With Express


## License

MIT © [Luke Edwards](https://lukeed.com)
