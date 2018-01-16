# Benchmarks

All apps employ two global middlewares with `req` mutations, an empty `GET` route handler for `favicon.ico` and a `GET` handler for the `/users/:id`, returning a `User: {id}` string response.

Results are taken after 1 warm-up run. The tool used for results is the following:

```sh
$ wrk -t8 -c100 -d30s http://localhost:3000/user/123
```

> Please remember that _your application code_ is most likely the slowest part of your application!<br> Switching from Express to Polka will (likely) not guarantee the same performance gains.


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
