import { cpus } from 'node:os';
import cluster from 'node:cluster';
import { createServer } from 'node:http';

export default function (app, num) {
	if (cluster.isMaster) {
		return {
			listen(PORT) {
				let cpu = cpus().length;
				let max = Math.min(num || cpu, cpu);
				while (max--) cluster.fork({ PORT });
			}
		};
	}

	return typeof app.listen === 'function' ? app : createServer(app);
}
