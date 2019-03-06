# @polka/cluster [![npm](https://badgen.now.sh/npm/v/@polka/cluster)](https://npmjs.org/package/@polka/cluster)

> Intialize and run a HTTP cluster; _not_ limited to [Polka][polka]!

Accepts a [Polka][polka] app, a programmatic [Polkadot][polkadot] app, or _any_ HTTP handler and runs it as a [Node.js cluster](https://nodejs.org/api/cluster.html#cluster_cluster).

> For more information on Node.js clustering, please read [How it Works](https://nodejs.org/api/cluster.html#cluster_how_it_works) :bow:

## Install

```
$ npm install --save @polka/cluster
```

## Usage

```js
const polka = require('polka');
const cluster = require('@polka/cluster');
const cors = require('cors')({ origin:true });

const { PORT=3000 } = process.env;

const app = (
  polka()
    .use(cors)
    .use('/items', require('./items'))
    .get('/alive', (req, res) => {
      res.end('OK');
    })
);

cluster(app, 4).listen(PORT);
```

## API

### cluster(handler, size)

Returns: `http.Server` or `Object`

If [`handler`](#handler) was an application, then it is returned. Otherwise a new `http.Server` instance is returned.

#### handler
Type: `Function` or `Object`

The HTTP handler function to run, which will be attached to the `http.Server` as its [`requestListener`](https://nodejs.org/api/http.html#http_event_request).

Similarly, `handler` may be an Object so long as it exposes a `listen` method.<br>
This means that you may pass in entire [Polka][polka], [Polkadot][polkadot], or Express applications!


#### size
Type: `Number`<br>
Default: `os.cpus().length`

The size of the cluster. Put differently, your application will run on `<size>` threads.

By default, your cluster will spawn one [Worker](https://nodejs.org/api/cluster.html#cluster_class_worker) _per thread_. For example, "most" modern Intel-based CPUs have two threads per CPU core, meaning that a quad-core CPU will have 8 threads... making `8` the default cluster size for this example.

> **Important:** Your `size` value **will not** exceed the value determined by `require('os').cpus().length`


## Support

Any issues or questions can be sent to the [Polka][polka] repository.<br>However, please specify that your inquiry is about `@polka/url` specifically.


## License

MIT © [Luke Edwards](https://lukeed.com)

[polka]: https://github.com/lukeed/polka
[polkadot]: https://github.com/lukeed/polkadot
