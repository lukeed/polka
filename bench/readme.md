# Benchmarks

All apps employ two global middlewares with `req` mutations, an empty `GET` route handler for `favicon.ico` and a `GET` handler for the `/users/:id`, returning a `User: {id}` string response.

Results are taken after 1 warm-up run. The tool used for results is the following:

```sh
$ wrk -t8 -c100 -d30s http://localhost:3000/user/123
```


## Node v9.1.0

```
#=> POLKA
Thread Stats   Avg      Stdev     Max   +/- Stdev
    Latency     2.34ms  198.33us   8.98ms   92.70%
    Req/Sec     5.15k   152.73     6.93k    85.70%
  1233025 requests in 30.10s, 127.00MB read
Requests/sec:  40962.46
Transfer/sec:      4.22MB

#=> EXPRESS
Thread Stats   Avg      Stdev     Max   +/- Stdev
    Latency     3.22ms  406.21us  10.57ms   92.21%
    Req/Sec     3.87k   248.19    10.42k    98.00%
  924698 requests in 30.10s, 115.52MB read
Requests/sec:  30716.24
Transfer/sec:      3.84MB
```

## Node v8.9.0

```
#=> POLKA
Thread Stats   Avg      Stdev     Max   +/- Stdev
    Latency     2.53ms  198.92us   8.93ms   84.30%
    Req/Sec     4.77k   417.95    19.25k    99.25%
  1139800 requests in 30.10s, 117.40MB read
Requests/sec:  37866.55
Transfer/sec:      3.90MB

#=> EXPRESS
Thread Stats   Avg      Stdev     Max   +/- Stdev
    Latency     3.24ms  354.08us  10.25ms   89.52%
    Req/Sec     3.71k   120.42     4.19k    68.83%
  887040 requests in 30.01s, 110.82MB read
Requests/sec:  29556.30
Transfer/sec:      3.69MB
```


## Node v6.11.1

```
#=> POLKA
Thread Stats   Avg      Stdev     Max   +/- Stdev
    Latency     3.02ms  268.67us  11.52ms   78.66%
    Req/Sec     3.99k   117.22     4.38k    74.49%
  955759 requests in 30.10s, 98.44MB read
Requests/sec:  31748.49
Transfer/sec:      3.27MB

#=> EXPRESS
Thread Stats   Avg      Stdev     Max   +/- Stdev
    Latency     4.60ms  355.35us  14.29ms   73.88%
    Req/Sec     2.62k    68.59     3.24k    68.88%
  626258 requests in 30.01s, 78.24MB read
Requests/sec:  20865.30
Transfer/sec:      2.61MB
```
