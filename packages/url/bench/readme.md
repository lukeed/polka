## Benchmarks

> Running on Node v22.12.0

***Modifications:***

Each candidate is _slightly_ modified to match the `search` and `query` values that `@polka/url` returns. This is done in an honest/best-effort manner to normalize all candidates (and pass the validation steps), especially considering that the typical user wants `query` to be parsed (and decoded) into an object.

Please see the [Raw Performance](#raw-performance) benchmarks for results ***without*** any modifications. However, do note that the raw-benchmark is effectively useless since all candidates do different things by default.


## Normalized (minimal)

> **Important:** All candidates listed pass validation – sometimes due to normalization.

```
Benchmark: "/foo/bar?user=tj&pet=fluffy"
  url.parse        x   2,786,655 ops/sec ±0.14% (197 runs sampled)
  new URL()        x   1,945,589 ops/sec ±0.09% (195 runs sampled)
  parseurl         x   3,769,985 ops/sec ±0.17% (196 runs sampled)
  @polka/url       x   4,384,948 ops/sec ±0.11% (195 runs sampled)

Benchmark: (REPEAT) "/foo/bar?user=tj&pet=fluffy"
  url.parse        x   2,800,105 ops/sec ±0.11% (196 runs sampled)
  new URL()        x   1,950,331 ops/sec ±0.78% (195 runs sampled)
  parseurl         x  32,916,543 ops/sec ±0.63% (192 runs sampled)
  @polka/url       x 107,568,527 ops/sec ±1.10% (192 runs sampled)

Benchmark: "/foo/bar?abc#123"
  url.parse        x   2,431,521 ops/sec ±0.60% (196 runs sampled)
  new URL()        x   2,194,648 ops/sec ±0.08% (197 runs sampled)
  parseurl         x   2,572,037 ops/sec ±0.37% (196 runs sampled)
  @polka/url       x   8,416,348 ops/sec ±0.61% (197 runs sampled)

Benchmark: "/foo/bar"
  url.parse        x  10,724,472 ops/sec ±0.21% (195 runs sampled)
  new URL()        x   2,874,192 ops/sec ±0.08% (196 runs sampled)
  parseurl         x  33,684,546 ops/sec ±1.02% (193 runs sampled)
  @polka/url       x  38,863,110 ops/sec ±0.54% (193 runs sampled)

Benchmark: "/"
  url.parse        x  14,490,460 ops/sec ±0.29% (195 runs sampled)
  new URL()        x   2,961,662 ops/sec ±0.26% (196 runs sampled)
  parseurl         x  53,179,222 ops/sec ±1.16% (188 runs sampled)
  @polka/url       x  70,449,273 ops/sec ±1.31% (190 runs sampled)
```


## Raw Performance

These are the results of the _unmodified_ candidates. In other words, there is **zero consistency** in the candidates outputs. For example:

* `url.parse#1` uses [`url.parse`](https://nodejs.org/api/url.html#url_url_parse_urlstring_parsequerystring_slashesdenotehost) with `parseQueryString` enabled<br>_It converts the `query` into a decoded object, but everything else remains encoded._

* `url.parse#2` is the same as `url.parse#1`, except `parseQueryString` is disabled.<br>_It leaves the `query` as a string & does no decoding whatsoever._

* `new URL()` does what it describes :)<br>_Everything remains encoded, except for `searchParams`, which is always an `URLSearchParams` instance with decoded values._

* `parseurl` never decodes any value segments and `query` is always a string.

* `@polka/url` never decodes any value segments except `query`, which is always a decoded object.

***Results***

```
Benchmark: (normal) "/foo/bar?user=tj&pet=fluffy"
  url.parse#1      x   2,765,357 ops/sec ±0.52% (197 runs sampled)
  url.parse#2      x   5,974,183 ops/sec ±0.32% (195 runs sampled)
  new URL()        x   2,973,462 ops/sec ±0.12% (197 runs sampled)
  parseurl         x   9,157,524 ops/sec ±0.37% (194 runs sampled)
  @polka/url       x   4,311,091 ops/sec ±0.14% (194 runs sampled)

Benchmark: (repeat) "/foo/bar?user=tj&pet=fluffy"
  url.parse#1      x   2,782,103 ops/sec ±0.12% (196 runs sampled)
  url.parse#2      x   6,068,865 ops/sec ±0.48% (194 runs sampled)
  new URL()        x   3,001,140 ops/sec ±0.07% (197 runs sampled)
  parseurl         x 105,485,588 ops/sec ±1.27% (194 runs sampled)
  @polka/url       x 107,098,254 ops/sec ±1.28% (194 runs sampled)

Benchmark: (normal) "/foo/bar?abc#123"
  url.parse#1      x   2,437,515 ops/sec ±0.92% (196 runs sampled)
  url.parse#2      x   3,804,083 ops/sec ±0.12% (194 runs sampled)
  new URL()        x   2,982,620 ops/sec ±0.07% (197 runs sampled)
  parseurl         x   3,219,924 ops/sec ±0.50% (196 runs sampled)
  @polka/url       x   8,389,305 ops/sec ±0.63% (192 runs sampled)

Benchmark: (normal) "/foo/bar"
  url.parse#1      x  10,774,201 ops/sec ±0.25% (196 runs sampled)
  url.parse#2      x  12,779,167 ops/sec ±0.74% (194 runs sampled)
  new URL()        x   3,444,515 ops/sec ±0.13% (196 runs sampled)
  parseurl         x  35,436,130 ops/sec ±0.66% (193 runs sampled)
  @polka/url       x  38,984,804 ops/sec ±0.53% (193 runs sampled)

Benchmark: (normal) "/"
  url.parse#1      x  14,640,936 ops/sec ±0.94% (193 runs sampled)
  url.parse#2      x  18,652,575 ops/sec ±0.31% (195 runs sampled)
  new URL()        x   3,580,881 ops/sec ±0.14% (195 runs sampled)
  parseurl         x  57,691,065 ops/sec ±1.01% (191 runs sampled)
  @polka/url       x  71,176,841 ops/sec ±1.33% (188 runs sampled)
```
