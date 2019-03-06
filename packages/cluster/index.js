const cluster = require('cluster');
const cpus = require('os').cpus().length;

module.exports = function (app, num) {
	if (cluster.isMaster) {
		return {
			listen(PORT) {
				let env = { PORT };
				let max = Math.min(num || cpus, cpus);
				while (max--) cluster.fork('.', { env });
			}
		};
	}

	return typeof app.listen === 'function' ? app : require('http').createServer(app);
}
