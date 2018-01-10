# Benchmark

All apps must have two global middlewares enabled (with request mutations), an empty `GET` route handler for `favicon.ico` and a `GET` handler for the `/users/:id`, returning a `User: {id}` string response.

The tool used for results is the following:

```sh
$ wrk -t12 -c100 -d30s http://localhost:3000/user/123
```

## Node v9.1.0

```
#=> POLKA
Thread Stats   Avg      Stdev     Max   +/- Stdev
    Latency     1.92ms  358.56us  28.83ms   94.34%
    Req/Sec     4.21k   724.58    44.48k    98.97%
  1509408 requests in 30.10s, 155.46MB read
Requests/sec:  50145.93
Transfer/sec:      5.16MB

#=> EXPRESS
Thread Stats   Avg      Stdev     Max   +/- Stdev
    Latency     2.79ms  545.98us  30.95ms   92.04%
    Req/Sec     2.89k   209.85     3.32k    93.08%
  1036447 requests in 30.02s, 129.48MB read
Requests/sec:  34528.66
Transfer/sec:      4.31MB
```

## Node v6.11.1

```
#=> POLKA
Thread Stats   Avg      Stdev     Max   +/- Stdev
    Latency     2.57ms  522.87us  31.84ms   97.46%
    Req/Sec     3.14k   164.45     4.15k    86.69%
  1125110 requests in 30.01s, 115.88MB read
Requests/sec:  37490.67
Transfer/sec:      3.86MB

#=> EXPRESS
Thread Stats   Avg      Stdev     Max   +/- Stdev
    Latency     3.96ms  638.85us  31.61ms   94.12%
    Req/Sec     2.03k   114.58     2.36k    85.92%
  729354 requests in 30.02s, 91.12MB read
Requests/sec:  24295.28
Transfer/sec:      3.04MB
```
