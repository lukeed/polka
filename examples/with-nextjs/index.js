const polka = require('polka')
const next = require('next')

const port = parseInt(process.env.PORT, 10) || 3000
const dev = process.env.NODE_ENV !== 'production'
const app = next({ dev })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  const server = polka()
	
  server.get('*', (req, res) => handle(req, res))

  server
    .listen(port)
    .then(() => console.log(`> Ready on http://localhost:${port}`))
})
