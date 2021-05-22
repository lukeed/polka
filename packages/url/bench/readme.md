## Benchmarks

> Running on Node v14.15.3

***Modifications:***

Each candidate is _slightly_ modified to match the `pathname` and `query` values that `@polka/url` returns. This is done in an honest/best-effort manner to normalize all candidates (and pass the validation steps), especially considering that the typical user _wants_ `pathname`s to be normalized and _wants_ `query` values to be parsed (and decoded) into an object.


### Without Decoding

> **Important:** All candidates listed pass validation – sometimes due to normalization.

```
Benchmark: "/foo/bar?user=tj&pet=fluffy"
  url.parse        x   1,437,988 ops/sec ±0.15% (193 runs sampled)
  new URL()        x     258,158 ops/sec ±0.17% (193 runs sampled)
  parseurl         x   2,074,250 ops/sec ±0.22% (193 runs sampled)
  @polka/url       x   2,584,006 ops/sec ±0.26% (194 runs sampled)

Benchmark: (REPEAT) "/foo/bar?user=tj&pet=fluffy"
  url.parse        x   1,457,258 ops/sec ±0.17% (193 runs sampled)
  new URL()        x     257,459 ops/sec ±0.24% (189 runs sampled)
  parseurl         x  26,687,772 ops/sec ±0.40% (192 runs sampled)
  @polka/url       x 117,737,558 ops/sec ±0.23% (193 runs sampled)

Benchmark: "/foo/bar"
  url.parse        x   5,928,214 ops/sec ±0.33% (191 runs sampled)
  new URL()        x     290,799 ops/sec ±0.17% (192 runs sampled)
  parseurl         x  17,597,099 ops/sec ±0.62% (189 runs sampled)
  @polka/url       x  34,097,146 ops/sec ±0.55% (192 runs sampled)

Benchmark: "/"
  url.parse        x   8,933,877 ops/sec ±0.70% (190 runs sampled)
  new URL()        x     333,268 ops/sec ±0.19% (193 runs sampled)
  parseurl         x  27,358,354 ops/sec ±0.76% (188 runs sampled)
  @polka/url       x  43,529,456 ops/sec ±1.99% (172 runs sampled)
```


### With Decoding

> **Important:** All candidates listed pass validation – sometimes due to normalization.

```
Benchmark: "/f%C3%B8%C3%B8%C3%9F%E2%88%82r"
  url.parse        x   1,038,724 ops/sec ±0.12% (193 runs sampled)
  new URL()        x     229,125 ops/sec ±0.17% (192 runs sampled)
  parseurl         x   1,370,300 ops/sec ±0.20% (192 runs sampled)
  @polka/url       x   1,540,894 ops/sec ±0.18% (192 runs sampled)

Benchmark: "/f%C3%B8%C3%B8%C3%9F%E2%88%82r?phone=%2b393383123549"
  url.parse        x     514,280 ops/sec ±0.40% (193 runs sampled)
  new URL()        x     187,672 ops/sec ±0.67% (192 runs sampled)
  parseurl         x     618,801 ops/sec ±0.10% (189 runs sampled)
  @polka/url       x     696,125 ops/sec ±0.14% (191 runs sampled)

Benchmark: (REPEAT) "/f%C3%B8%C3%B8%C3%9F%E2%88%82r?phone=%2b393383123549"
  url.parse        x     425,909 ops/sec ±0.29% (193 runs sampled)
  new URL()        x     187,735 ops/sec ±0.14% (194 runs sampled)
  parseurl         x   1,770,147 ops/sec ±0.15% (193 runs sampled)
  @polka/url       x 197,963,726 ops/sec ±0.18% (194 runs sampled)

Benchmark: "/foo/bar?hello=123"
  url.parse        x   1,133,709 ops/sec ±0.28% (190 runs sampled)
  new URL()        x     236,384 ops/sec ±0.20% (193 runs sampled)
  parseurl         x   1,431,879 ops/sec ±0.19% (191 runs sampled)
  @polka/url       x   3,883,489 ops/sec ±0.37% (192 runs sampled)

Benchmark: "/foo/bar"
  url.parse        x   1,824,376 ops/sec ±0.54% (192 runs sampled)
  new URL()        x     252,204 ops/sec ±0.18% (192 runs sampled)
  parseurl         x   2,329,132 ops/sec ±0.26% (193 runs sampled)
  @polka/url       x  19,972,200 ops/sec ±0.64% (188 runs sampled)
```
