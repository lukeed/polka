import { createServer } from 'http';
import app from './server';

// We're only doing this for HMR
// ~> but we actually don't even have to!
const server = createServer(app.handler);

let curr = app.handler;

server.listen(process.env.PORT || 3000, error => {
  if (error) {
    console.log(error);
  }

  console.log('🚀 started');
});

if (module.hot) {
  console.log('✅  Server-side HMR Enabled!');

  module.hot.accept('./server', () => {
    console.log('🔁  HMR Reloading `./server`...');
    server.removeListener('request', curr);
    const updated = require('./server').default.handler;
    server.on('request', updated);
    curr = updated;
  });
}
