# Example: `@polka/cluster`

> You can swap Polka for [Polkadot](https://github.com/lukeed/polkadot) too!

A tiny example that demonstrates how to pair [`@polka/cluster`](https://github.com/lukeed/polka/tree/next/packages/cluster) with a Polka application.

**What's am I looking at?**

We build a normal Polka application (see `const app = polka()...`). Nothing changes here.

However, when starting the app, we _no longer_ call `app.listen` directly! Instead, we hand off the `app` to `@polka/cluster` so that it can be in charge of running it. We do this through:

```js
cluster(app, 4).listen(PORT);
```

> **Note:** The `4` here is optional, but it means that we'll spawn 4 clones of our application (all on the same port).<br>
If omitted, the cluster will spawn one `app` per CPU on your machine.

**What else is different?**

Nothing. Your application runs completely normal! The only difference is that we're allowing the [Node.js `cluster` module](https://nodejs.org/api/cluster.html#cluster_how_it_works) to control and load-balance incoming TCP traffic across all Polka apps. Pretty cool, right?

> **Note:** You can see multiple `node` processes in your OS' Task Manager/Activity Monitor application.


## Setup

```sh
$ npm install
$ npm start
```

## Usage

There is only one route (`POST /`) for the purpose of this demo.

```sh
$ curl localhost:3000
#=> (200) OK

$ curl localhost:3000/lukeed
#=> (200) Hello, lukeed
```
