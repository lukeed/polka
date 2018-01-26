import CONFIG from '../firebase.json';

const STORAGE = localStorage;
const KEYID = `firebase:authUser:${CONFIG.apiKey}:[DEFAULT]`;

export function isUser() {
	let str = STORAGE.getItem(KEYID);
	return str && JSON.parse(str);
}

export function getToken() {
	let user = isUser() || {};
	return (user.stsTokenManager || {}).accessToken;
}
