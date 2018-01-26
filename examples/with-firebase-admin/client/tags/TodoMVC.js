import isReady from 'is-ready';
import { Component } from 'preact';
import { get, post, put, del } from '../fetch';
import TodoFooter from './Footer';
import TodoItem from './Item';

const toAuth = str => (str && { Authorization:`Bearer: ${str}` });

const FILTERS = {
	all: obj => true,
	active: obj => !obj.completed,
	completed: obj => obj.completed
};

export default class Todos extends Component {
	state = { editing:'', items:[], token:'', filter:'all' }

	onAddItem = e => {
		if (e.keyCode !== 13) return;
		let title = e.target.value.trim();
		if (title) {
			let { items, token } = this.state;
			post('items', { completed:false, title }, { headers:toAuth(token) }).then(obj => {
				this.setState({ items:items.concat(obj) });
				e.target.value = null; // reset
			});
		}
	}

	onEdit = id => this.setState({ editing:id })
	onCancel = _ => this.setState({ editing:null })

	onSave = (obj, text) => {
		obj.title = text;
		let { token, items } = this.state;
		put(`items/${obj.id}`, obj, { headers:toAuth(token) }).then(_ => {
			this.setState({
				editing: null,
				items: items.map(x => x.id === obj.id ? obj : x)
			});
		});
	}

	onToggle = obj => {
		obj.completed = !obj.completed;
		let { token, items } = this.state;
		put(`items/${obj.id}`, obj, { headers:toAuth(token) }).then(_ => {
			this.setState({
				items: items.map(x => x.id === obj.id ? obj : x)
			});
		});
	}

	clearCompleted = e => {
		let { items, token } = this.state;
		let config = { headers:toAuth(token) };
		return Promise.all(
			items.filter(FILTERS.completed).map(o => del(`items/${o.id}`, null, config))
		).then(_ => {
			this.setState({
				items: items.filter(FILTERS.active)
			});
		});
	}

	onDestroy = obj => {
		let id = obj.id;
		let { items, token } = this.state;
		del(`items/${id}`, null, { headers:toAuth(token) }).then(_ => {
			this.setState({ items:items.filter(x => x.id !== id) });
		});
	}

	componentWillMount() {
		let filter = this.props.filter || 'all';
		isReady(['firebase', 'firebase.auth']).then(_ => {
			let token = firebase.auth().currentUser.toJSON().stsTokenManager.accessToken;
			get('items', null, { headers:toAuth(token) }).then(arr => {
				this.setState({ items:arr, token, filter });
			});
		});
	}

	componentWillReceiveProps(nxt) {
		this.setState({ filter:nxt.filter || 'all' });
	}

	render(_, state) {
		let items = state.items;
		let visible = items.filter(FILTERS[state.filter]);
		let numActive = items.reduce((x, obj) => x + Number(!obj.completed), 0);
		let numComplete = items.length - numActive;

		return (
			<section class="todoapp">
				<header class="header">
					<h1>todos</h1>
					<input class="new-todo" autofocus
						placeholder="What needs to be done?"
						onkeydown={ this.onAddItem } />
				</header>

				{
					items.length && (
						<section class="main">
							<input class="toggle-all" type="checkbox" onchange={ this.toggleAll } />
							<ul class="todo-list">
								{
									visible.map(obj => (
										<TodoItem
											data={obj} key={obj.id}
											editing={state.editing === obj.id}
											onToggle={this.onToggle} onDestroy={this.onDestroy}
											onEdit={this.onEdit} onSave={this.onSave} onCancel={this.onCancel}
										/>
									))
								}
							</ul>
						</section>
					)
				}

				{
					(numActive || numComplete) && (
						<TodoFooter active={numActive} completed={numComplete}
							filter={state.filter} onClear={this.clearCompleted} />
					)
				}
			</section>
		);
	}
}
