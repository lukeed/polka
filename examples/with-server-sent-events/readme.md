# Example: Server-Sent Events

Small `polka` example demonstrating how to use [Server-Sent Events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events).

The `public` directory contains an `index.html` file managing the Event Source Web API to subscribe to Server-Sent Events.
This file is served by Polka as a static asset using [`sirv`](https://github.com/lukeed/sirv) middleware.

On the server-side, the `/subscribe` endpoint initiates the communication channel for events to be sent.

## Setup

```sh
$ npm install
$ npm start
```

## Usage

Open a browser to `localhost:3000` and Server-Sent Events will be automatically subscribed to.
