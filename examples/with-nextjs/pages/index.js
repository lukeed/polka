import React from 'react';
import Link from 'next/link';

export default () => (
	<div>
		<h1>Home Page</h1>
		<Link href="/about">
			<a>Link to About Page</a>
		</Link>
	</div>
)
