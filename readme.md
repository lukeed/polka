<div align="center">
  <img src="/polka.png" alt="Polka" width="400" height="300" />
</div>

<h1 align="center">Polka</h1>

<div align="center">
  <a href="https://npmjs.org/package/polka">
    <img src="https://img.shields.io/npm/v/polka.svg" alt="version" />
  </a>
  <a href="https://travis-ci.org/lukeed/polka">
    <img src="https://img.shields.io/travis/lukeed/polka.svg" alt="travis" />
  </a>
  <a href="https://npmjs.org/package/polka">
    <img src="https://img.shields.io/npm/dm/polka.svg" alt="downloads" />
  </a>
</div>

<div align="center">A micro web server so fast, it'll make you dance! :dancers:</div>

<br />

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
