import cx from 'obj-str';
import { h, Component } from 'preact';

export default class TodoItem extends Component {
	state = { text:'' }

	onSubmit = e => {
		if (!this.props.editing) return;
		let obj = this.props.data;
		let val = e.target.value.trim();
		val ? this.props.onSave(obj, val): this.props.onDestroy(obj);
	}

	handleEdit = () => {
		let obj = this.props.data;
		this.setState({ text:obj.title });
		this.props.onEdit(obj.id);
	}

	onToggle = e => {
		e.preventDefault();
		let obj = this.props.data;
		this.props.onToggle(obj);
	}

	onKeydown = e => {
		if (e.which === 13) {
			this.onSubmit(e);
		} else if (e.which === 27) {
			this.setState({ text:'' });
			this.props.onCancel();
		}
	}

	onDelete = () => {
		this.props.onDestroy(this.props.data);
	}

	componentDidUpdate() {
		let node = this.base && this.base.querySelector('.edit');
		if (node) node.focus();
	}

	render(props, state) {
		let editing = props.editing;
		let { title, completed } = props.data;

		return (
			<li class={ cx({ completed, editing }) }>
				<div class="view">
					<input class="toggle" type="checkbox" checked={ completed } onChange={ this.onToggle } />
					<label ondblclick={ this.handleEdit }>{ title }</label>
					<button class="destroy" onclick={ this.onDelete } />
				</div>
				{ editing && (
					<input class="edit" value={ state.text } autofocus
						onblur={ this.onSubmit } onkeydown={ this.onKeydown } />
				) }
			</li>
		);
	}
}
