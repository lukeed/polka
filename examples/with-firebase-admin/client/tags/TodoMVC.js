import isReady from 'is-ready';
import { Component } from 'preact';
import { get, post, put, del } from '../utils/api';
import TodoFooter from './Footer';
import TodoItem from './Item';

const toAuth = str => (str && { Authorization:`Bearer: ${str}` });

const FILTERS = {
	all: obj => true,
	active: obj => !obj.completed,
	completed: obj => obj.completed
};

export default class Todos extends Component {
	state = { editing:'', items:[], filter:'all' }

	onAddItem = e => {
		if (e.keyCode !== 13) return;
		let title = e.target.value.trim();
		if (!title) return; // exit
		let items = this.state.items;
		post('items', { completed:false, title }).then(obj => {
			this.setState({ items:items.concat(obj) });
			e.target.value = null; // reset
		});
	}

	onEdit = id => this.setState({ editing:id })
	onCancel = _ => this.setState({ editing:null })

	onSave = (obj, text) => {
		obj.title = text;
		put(`items/${obj.id}`, obj).then(_ => {
			let items = this.state.items.map(x => x.id === obj.id ? obj : x);
			this.setState({ editing:null, items });
		});
	}

	onToggle = obj => {
		obj.completed = !obj.completed;
		put(`items/${obj.id}`, obj).then(_ => {
			let items = this.state.items.map(x => x.id === obj.id ? obj : x);
			this.setState({ items });
		});
	}

	clearCompleted = e => {
		let items = this.state.items;
		return Promise.all(
			items.filter(FILTERS.completed).map(o => del(`items/${o.id}`))
		).then(_ => {
			this.setState({
				items: items.filter(FILTERS.active)
			});
		});
	}

	onDestroy = obj => {
		let id = obj.id;
		del(`items/${id}`).then(_ => {
			let items = this.state.items.filter(x => x.id !== id);
			this.setState({ items });
		});
	}

	componentDidMount() {
		let filter = this.props.filter || 'all';
		get('items').then(arr => {
			this.setState({ items:arr, filter });
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
					items.length > 0 && (
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
					(numActive || numComplete) > 0 && (
						<TodoFooter active={numActive} completed={numComplete}
							filter={state.filter} onClear={this.clearCompleted} />
					)
				}
			</section>
		);
	}
}
