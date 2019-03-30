## Benchmarks

> Run on Node v10.13.0

### Without Decoding

All candidates process the `url` as is & return (nearly) identical outputs.

***Differences:***

* Both `parseurl` and `@polka/url` include a `_raw` key
* Both `parseurl` and `@polka/url` mutate the `req` object for memoization on repeat calls
* Since Node.js `http.Server` only receives pathing segments, `@polka/url` does not bother including:
  * `protocol`
  * `slashes`
  * `auth`
  * `host`
  * `port`
  * `hostname`
  * `hash`

***Results:***

```
# Parsing: "/foo/bar?user=tj&pet=fluffy"
  native       x  4,253,173 ops/sec ±0.68% (192 runs sampled)
  parseurl     x  8,070,055 ops/sec ±0.17% (196 runs sampled)
  @polka/url   x 30,073,280 ops/sec ±3.09% (194 runs sampled)

# REPEAT: "/foo/bar?user=tj&pet=fluffy"
  native       x   4,264,907 ops/sec ±0.22% (194 runs sampled)
  parseurl     x 141,602,256 ops/sec ±0.27% (194 runs sampled)
  @polka/url   x 221,088,023 ops/sec ±0.15% (195 runs sampled)

# Parsing: "/foo/bar"
  native       x 10,114,439 ops/sec ±0.49% (194 runs sampled)
  parseurl     x 26,714,707 ops/sec ±0.15% (194 runs sampled)
  @polka/url   x 67,833,366 ops/sec ±0.30% (194 runs sampled)

# Parsing: "/"
  native       x 16,811,257 ops/sec ±0.25% (190 runs sampled)
  parseurl     x 36,045,298 ops/sec ±0.27% (192 runs sampled)
  @polka/url   x 68,199,005 ops/sec ±0.25% (195 runs sampled)
```



### With Decoding

All candidates must decode the incoming `url` and return value segments as decoded strings, too.<br>
Similarly, the `query` key must be parsed into an Object whose keys & values are also decoded.

> **Important:** The `parseurl`, `native/bad#1`, and `native/bad#2` candidates are "unofficial" implementations.

* `native/bad#1` uses [`url.parse`](https://nodejs.org/api/url.html#url_url_parse_urlstring_parsequerystring_slashesdenotehost) with `parseQueryString` enabled<br>
    _It decodes the `query` correctly, but all other segments are still encoded segments._

* `native/bad#2` is the same as `native/bad#1` except it passes thru `decodeURIComponent` first<br>
    _It **double-decodes** the `query`, allowing you to lose characters!_

* `parseurl` does not handle decoding for you<br>
    _You have the same dilemma and inconsistencies of `native/bad#1` and `native/bad#2` too._<br>
    _However, this candidate takes an approach to rectify the output._

```js
// Example of inconsistencies:
// ~> native/bad#1, native/bad#2, parseurl

const demo = '/f%C3%B8%C3%B8?phone=%2b8675309';
// Desired: '/føø?phone=+8675309'

url.parse(demo, true);
// (right) query => { phone: '+8675309' }
// (wrong) pathname => '/f%C3%B8%C3%B8'

url.parse(decodeURIComponent(demo), true);
// (wrong) query => { phone: ' 8675309' }
// (right) pathname => '/føø'
```

***Results:***

```
# DECODE: "/f%C3%B8%C3%B8%C3%9F%E2%88%82r"
  native/bad#1   x 4,388,726 ops/sec ±0.62% (191 runs sampled)
  native/bad#2   x 1,332,192 ops/sec ±0.36% (192 runs sampled)
  native         x   588,862 ops/sec ±0.37% (194 runs sampled)
  parseurl       x   625,776 ops/sec ±0.13% (194 runs sampled)
  @polka/url     x 1,638,012 ops/sec ±0.36% (194 runs sampled)

# DECODE: "/f%C3%B8%C3%B8%C3%9F%E2%88%82r?phone=%2b393383123549"
  native/bad#1   x 267,614 ops/sec ±0.37% (193 runs sampled)
  native/bad#2   x 239,160 ops/sec ±0.34% (193 runs sampled)
  native         x 176,155 ops/sec ±0.32% (194 runs sampled)
  parseurl       x 179,706 ops/sec ±0.28% (194 runs sampled)
  @polka/url     x 671,500 ops/sec ±0.30% (193 runs sampled)

# DECODE: "/foo/bar"
  native/bad#1   x  9,230,890 ops/sec ±0.88% (193 runs sampled)
  native/bad#2   x  1,906,574 ops/sec ±0.24% (192 runs sampled)
  native         x    891,891 ops/sec ±0.34% (194 runs sampled)
  parseurl       x    927,090 ops/sec ±0.13% (194 runs sampled)
  @polka/url     x 34,007,102 ops/sec ±1.40% (193 runs sampled)
````
