const http = require('http');

http.createServer((req, res) => {
	if (req.url === '/favicon.ico') return;
	if (req.url === '/') return res.end('Hello');
}).listen(3000);
