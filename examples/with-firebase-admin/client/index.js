import { h, render } from 'preact';
import App from './tags/App';
import 'todomvc-app-css';

let root = document.getElementById('root');
let diff = root.firstElementChild;
diff = render(<App />, root, diff);

if (module.hot) {
  module.hot.accept();
}
