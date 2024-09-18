import { resolve } from 'node:url';

export default function (res, code=302, location='') {
	if (!location && typeof code === 'string') {
		location = code;
		code = 302;
	}

	let req = res.socket.parser.incoming;
	if (location === 'back') {
		location = req.headers.referrer || req.headers.referer || '/';
	} else if (location) {
		location = resolve(req.originalUrl, location);
	}

	res.writeHead(code, {
		'Location': location,
		'Content-Length': 0
	});

	res.end();
}
