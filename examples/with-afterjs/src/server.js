import polka from 'polka';
import { render } from '@jaredpalmer/after';
import serve from 'serve-static';
import routes from './routes';

const assets = require(process.env.RAZZLE_ASSETS_MANIFEST);
const statics = serve(process.env.RAZZLE_PUBLIC_DIR);

const server = polka();

server
  .use(statics)
  .get('/*', async (req, res) => {
    try {
      const html = await render({
        req,
        res,
        routes,
        assets,
        // Anything else you add here will be made available
        // within getInitialProps(ctx)
        // e.g a redux store...
        customThing: 'thing',
      });
      res.end(html);
    } catch (error) {
    	let json = JSON.stringify(error);
    	res.setHeader('Content-Type', 'application/json');
    	res.setHeader('Content-Length', json.length);
    	res.end(json);
    }
  });

export default server;
