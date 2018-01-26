import { Component } from 'preact';

export default class Login extends Component {
	state = { email:'', password:'' }

	onSubmit = ev => {
		ev.preventDefault();
		let { email, password } = this.state;
		if (!email || !password) return console.error('[TODO]: An email and password are required!');
		firebase.auth().signInWithEmailAndPassword(email, password).catch(err => {
			console.error('[AUTH]', err.message);
		}).then(data => {
			console.log('> data', data);
		})
	}

	onInput = key => ev => {
		this.setState({ [key]: ev.target.value });
	}

	render() {
		return (
			<form onsubmit={ this.onSubmit }>
				<h1>Login</h1>
				<input class="new-todo" required placeholder="Email Address" autofocus oninput={ this.onInput('email') } />
				<input class="new-todo" required placeholder="Password" type="password" oninput={ this.onInput('password') } />
				<button type="submit">Login</button>
			</form>
		);
	}
}
