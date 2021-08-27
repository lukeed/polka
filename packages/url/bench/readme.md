## Benchmarks

> Running on Node v16.8.0

***Modifications:***

Each candidate is _slightly_ modified to match the `search` and `query` values that `@polka/url` returns. This is done in an honest/best-effort manner to normalize all candidates (and pass the validation steps), especially considering that the typical user wants `query` to be parsed (and decoded) into an object.

Please see the [Raw Performance](#raw-performance) benchmarks for results ***without*** any modifications. However, do note that the raw-benchmark is effectively useless since all candidates do different things by default.


## Normalized (minimal)

> **Important:** All candidates listed pass validation – sometimes due to normalization.

```
Benchmark: "/foo/bar?user=tj&pet=fluffy"
  url.parse        x   1,766,192 ops/sec ±0.59% (189 runs sampled)
  new URL()        x     254,742 ops/sec ±0.93% (188 runs sampled)
  parseurl         x   2,296,634 ops/sec ±0.43% (188 runs sampled)
  @polka/url       x   3,096,770 ops/sec ±0.56% (189 runs sampled)

Benchmark: (REPEAT) "/foo/bar?user=tj&pet=fluffy"
  url.parse        x   1,794,821 ops/sec ±1.01% (188 runs sampled)
  new URL()        x     258,587 ops/sec ±0.63% (189 runs sampled)
  parseurl         x  30,616,846 ops/sec ±0.47% (191 runs sampled)
  @polka/url       x 314,370,079 ops/sec ±0.36% (189 runs sampled)

Benchmark: "/foo/bar"
  url.parse        x   7,373,531 ops/sec ±0.63% (188 runs sampled)
  new URL()        x     291,642 ops/sec ±0.83% (189 runs sampled)
  parseurl         x  21,946,341 ops/sec ±0.93% (186 runs sampled)
  @polka/url       x  48,697,030 ops/sec ±0.49% (189 runs sampled)

Benchmark: "/"
  url.parse        x  10,744,706 ops/sec ±0.47% (188 runs sampled)
  new URL()        x     315,725 ops/sec ±0.86% (184 runs sampled)
  parseurl         x  46,863,886 ops/sec ±1.06% (189 runs sampled)
  @polka/url       x  72,862,914 ops/sec ±0.54% (190 runs sampled)
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
  url.parse#1      x   1,757,099 ops/sec ±0.67% (188 runs sampled)
  url.parse#2      x   4,487,853 ops/sec ±0.70% (185 runs sampled)
  new URL()        x     284,153 ops/sec ±0.68% (187 runs sampled)
  parseurl         x   9,848,571 ops/sec ±0.97% (186 runs sampled)
  @polka/url       x   3,040,460 ops/sec ±0.79% (188 runs sampled)

Benchmark: (repeat) "/foo/bar?user=tj&pet=fluffy"
  url.parse#1      x   1,827,115 ops/sec ±0.41% (190 runs sampled)
  url.parse#2      x   4,442,871 ops/sec ±0.72% (183 runs sampled)
  new URL()        x     286,803 ops/sec ±0.30% (189 runs sampled)
  parseurl         x  78,897,892 ops/sec ±1.51% (182 runs sampled)
  @polka/url       x 291,908,732 ops/sec ±4.97% (179 runs sampled)

Benchmark: (normal) "/foo/bar"
  url.parse#1      x   7,824,747 ops/sec ±0.65% (186 runs sampled)
  url.parse#2      x   9,015,704 ops/sec ±0.68% (188 runs sampled)
  new URL()        x     320,978 ops/sec ±0.41% (188 runs sampled)
  parseurl         x  25,611,676 ops/sec ±0.45% (189 runs sampled)
  @polka/url       x  48,554,610 ops/sec ±0.48% (190 runs sampled)

Benchmark: (normal) "/"
  url.parse#1      x  11,682,323 ops/sec ±0.81% (187 runs sampled)
  url.parse#2      x  15,679,363 ops/sec ±0.61% (188 runs sampled)
  new URL()        x     348,880 ops/sec ±0.35% (189 runs sampled)
  parseurl         x  34,522,603 ops/sec ±0.73% (190 runs sampled)
  @polka/url       x  71,136,459 ops/sec ±0.58% (189 runs sampled)
```
