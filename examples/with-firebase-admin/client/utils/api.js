import { getToken } from './local';

const API = '/api/';

const HEADERS = {
	'Content-Type': 'application/json;charset=UTF-8',
	'Accept': 'application/json, text/plain, */*'
};

function handle(r) {
  let act = r.ok ? 'resolve' : 'reject';
  let type = r.status === 204 ? 'text' : 'json';
  return r[type]().then(data => Promise[act](data));
}

function send(method, uri, data, opts) {
  opts = opts || {};
  opts.method = method;
  opts.headers = HEADERS;
  let token = getToken(); // fresh check on localstorage
  token && (opts.headers.Authorization = `Bearer ${token}`);
  data && (opts.body = JSON.stringify(data));
  return fetch(`${API}${uri}`, opts).then(handle);
}

export const get = send.bind(null, 'get');
export const put = send.bind(null, 'put');
export const post = send.bind(null, 'post');
export const del = send.bind(null, 'delete');
