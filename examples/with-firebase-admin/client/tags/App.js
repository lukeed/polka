import isReady from 'is-ready';
import { h, Component } from 'preact';
import { Router, route } from 'preact-router';
import { isUser } from '../utils/local';
import CONFIG from '../firebase.json';
import TodoMVC from './TodoMVC';
import Login from './Login';

export default class App extends Component {
	state = { user:isUser() }

	onRoute = obj => {
		let isUser = !!this.state.user;
		let isLogin = !!~obj.url.indexOf('login');
		if (!isUser) return route('/login', true);
		if (isUser && isLogin) return route('/', true);
	}

	componentWillMount() {
		isReady('firebase').then(_ => {
			let user = this.state.user;
			let app = firebase.initializeApp(CONFIG)
			isReady('firebase.auth').then(_ => {
				app.auth().onAuthStateChanged(obj => {
					let isNew = (!!user !== !!obj);
					this.setState({ user:obj }, _ => {
						isNew && route(obj ? '/' : '/login', true);
					});
				});
			});
		});
	}

	render(_, state) {
		return (
			<Router onChange={ this.onRoute }>
				<Login path="/login" />
				<TodoMVC path="/:filter?" />
			</Router>
		);
	}
}
