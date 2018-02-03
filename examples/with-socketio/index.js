const polka = require('polka');
const static = require('serve-static');

const { PORT=3000 } = process.env;

const { server } = polka().use(static('public'));
const io = require('socket.io')(server);

server.listen(PORT, _ => {
	console.log(`> Running on localhost:${PORT}`);
});

// Chatroom
let numUsers = 0;
io.on('connection', socket => {
	let added = false;

	// when the client emits 'new message', this listens and executes
	socket.on('new message', data => {
		// we tell the client to execute 'new message'
		socket.broadcast.emit('new message', {
			username: socket.username,
			message: data
		});
	});

	// when the client emits 'add user', this listens and executes
	socket.on('add user', username => {
		if (added) return;

		// we store the username in the socket session for this client
		socket.username = username;
		++numUsers;
		added = true;
		socket.emit('login', { numUsers });
		// echo globally (all clients) that a person has connected
		socket.broadcast.emit('user joined', { username, numUsers });
	});

	// when the client emits 'typing', we broadcast it to others
	socket.on('typing', _ => socket.broadcast.emit('typing', { username:socket.username }));

	// when the client emits 'stop typing', we broadcast it to others
	socket.on('stop typing', _ => socket.broadcast.emit('stop typing', { username:socket.username }));

	// when the user disconnects.. perform this
	socket.on('disconnect', _ => {
		if (added) {
			--numUsers;
			// echo globally that this client has left
			socket.broadcast.emit('user left', { numUsers, username:socket.username });
		}
	});
});
