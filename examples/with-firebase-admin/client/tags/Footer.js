import { Link } from 'preact-router/match';

export default function (props) {
	let num = props.active;
	let now = props.filter;

	return (
		<footer class="footer">
			<span class="todo-count">
				<strong>{num}</strong> { num > 1 ? 'items' : 'item' } left
			</span>

			<ul class="filters">
				<li><Link activeClassName="selected" href="/">All</Link></li>
				<li><Link activeClassName="selected" href="/active">Active</Link></li>
				<li><Link activeClassName="selected" href="/completed">Completed</Link></li>
			</ul>

			{
				props.completed > 0 && (
					<button class="clear-completed" onClick={props.onClear}>Clear completed</button>
				)
			}
		</footer>
	);
}
