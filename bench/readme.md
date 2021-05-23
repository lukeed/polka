# Benchmarks

All apps employ two global middlewares with `req` mutations, an empty `GET` route handler for `favicon.ico` and a `GET` handler for the `/users/:id`, returning a `User: {id}` string response.

Results are taken after 1 warm-up run. The tool used for results is the following:

```sh
$ wrk -t8 -c100 -d30s http://localhost:3000/user/123
```

> Please remember that _your application code_ is most likely the slowest part of your application!<br> Switching from Express to Polka will (likely) not guarantee the same performance gains.


## Node v12.13.0

```
#=> POLKA
Thread Stats   Avg      Stdev     Max   +/- Stdev
    Latency     2.19ms  188.34us   8.30ms   91.27%
    Req/Sec     5.50k   162.53     6.37k    86.88%
  1313000 requests in 30.01s, 135.23MB read
Requests/sec:  43753.41
Transfer/sec:      4.51MB

#=> EXPRESS
Thread Stats   Avg      Stdev     Max   +/- Stdev
    Latency     2.98ms  271.33us  10.54ms   86.23%
    Req/Sec     4.05k   143.92     4.31k    83.04%
  966328 requests in 30.01s, 120.72MB read
Requests/sec:  32198.32
Transfer/sec:      4.02MB
```

## Node v10.17.0

```
#=> POLKA
Thread Stats   Avg      Stdev     Max   +/- Stdev
    Latency     1.96ms  239.71us   8.66ms   88.31%
    Req/Sec     6.14k   454.72    20.12k    95.80%
  1468383 requests in 30.10s, 151.24MB read
Requests/sec:  48784.16
Transfer/sec:      5.02MB

#=> EXPRESS
Thread Stats   Avg      Stdev     Max   +/- Stdev
    Latency     2.94ms  422.02us  12.56ms   88.31%
    Req/Sec     4.11k   251.40     4.54k    82.96%
  980849 requests in 30.01s, 122.54MB read
Requests/sec:  32684.01
Transfer/sec:      4.08MB
```

## Node v9.1.0

```
#=> POLKA
Thread Stats   Avg      Stdev     Max   +/- Stdev
    Latency     2.39ms  173.68us   7.90ms   89.40%
    Req/Sec     5.03k   110.03     5.80k    70.42%
  1204800 requests in 30.10s, 124.09MB read
Requests/sec:  40022.18
Transfer/sec:      4.12MB

#=> EXPRESS
Thread Stats   Avg      Stdev     Max   +/- Stdev
    Latency     3.24ms  388.15us   9.84ms   92.78%
    Req/Sec     3.72k   105.01     4.38k    63.96%
  889146 requests in 30.01s, 111.08MB read
Requests/sec:  29623.83
Transfer/sec:      3.70MB
```

## Node v8.9.0

```
#=> POLKA
Thread Stats   Avg      Stdev     Max   +/- Stdev
    Latency     2.59ms  186.29us   5.82ms   67.71%
    Req/Sec     4.66k   142.28     5.29k    68.67%
  1115653 requests in 30.10s, 114.91MB read
Requests/sec:  37059.21
Transfer/sec:      3.82MB

#=> EXPRESS
Thread Stats   Avg      Stdev     Max   +/- Stdev
    Latency     3.41ms  347.21us   8.07ms   69.60%
    Req/Sec     3.53k   104.84     3.91k    69.83%
  844077 requests in 30.01s, 105.45MB read
Requests/sec:  28127.26
Transfer/sec:      3.51MB
```


## Node v6.11.1

```
#=> POLKA
Thread Stats   Avg      Stdev     Max   +/- Stdev
    Latency     3.16ms  208.50us   6.93ms   75.13%
    Req/Sec     3.82k   101.28     5.34k    75.58%
  911888 requests in 30.01s, 93.92MB read
Requests/sec:  30384.16
Transfer/sec:      3.13MB

#=> EXPRESS
Thread Stats   Avg      Stdev     Max   +/- Stdev
    Latency     4.61ms  289.07us  14.19ms   75.35%
    Req/Sec     2.61k    62.88     2.92k    70.71%
  623917 requests in 30.01s, 77.95MB read
Requests/sec:  20788.27
Transfer/sec:      2.60MB
```
