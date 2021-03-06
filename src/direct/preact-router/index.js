import { createElement } from 'preact';
import { Router, Link } from 'preact-router';

const url = path =>
	location.pathname + (location.pathname.endsWith('/') ? '' : '/') + path;

function Page1() {
	return <h2>Page 1</h2>;
}

function Page2() {
	return <h2>Page 2</h2>;
}

export default function App() {
	return (
		<div>
			<h1>Preact Router</h1>
			<h2>Links</h2>
			<nav>
				<ul id="links">
					<li>
						<Link activeClassName="active" href={url('')}>
							Page 1
						</Link>
					</li>
					<li>
						<Link activeClassName="active" href={url('page2')}>
							Page 2
						</Link>
					</li>
				</ul>
			</nav>
			<div id="router-content">
				<Router>
					<Page1 path={url('')} />
					<Page2 path={url('page2')} />
				</Router>
			</div>
		</div>
	);
}
