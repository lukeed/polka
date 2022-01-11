import app from './server';

let { handler, server } = app;

server.listen(process.env.PORT || 3000, () => {
  console.log('🚀 started');
});

if (module.hot) {
  console.log('✅  Server-side HMR Enabled!');

  module.hot.accept('./server', () => {
    console.log('🔁  HMR Reloading `./server`...');
    server.removeListener('request', handler);
    let nxt = require('./server').default;
    server.on('request', nxt.handler);
    handler = nxt.handler;
  });
}
