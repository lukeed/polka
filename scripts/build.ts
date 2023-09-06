import { readdir } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { join, resolve } from 'node:path';

let bundt = require.resolve('bundt');
let root = resolve('./packages');

let packages = await readdir(root, {
	withFileTypes: true,
});

for (let pkg of packages) {
	if (pkg.isFile()) continue;

	console.log('>>', pkg.name);
	execFileSync(bundt, ['index.js'], {
		cwd: join(root, pkg.name),
		stdio: 'inherit',
	});
}
