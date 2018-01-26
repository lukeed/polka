const send = require('@polka/send-type');
const firebase = require('firebase-admin');
const secret = require('../secret.json');

firebase.initializeApp({
  credential: firebase.credential.cert(secret),
  databaseURL: 'https://temp123-1414d.firebaseio.com'
});

const Auth = exports.Auth = firebase.auth();
const DB = exports.DB = firebase.database();

// Middleware: Authenticate Incoming Request
exports.isUser = (req, res, next) => {
	let token = req.headers['authorization'];
	if (!token) return send(res, 401, 'Token not found.');
	token = token.split(' ')[1]; // strip "Bearer"
	Auth.verifyIdToken(token)
		.then(user => (req.user=user) && next())
		.catch(err => send(res, 401, 'Invalid token.'));
};
