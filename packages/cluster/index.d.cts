import type { RequestListener } from 'http';

declare namespace cluster {
	export interface ClusterController {
		listen(port: number): void;
	}
}

declare function cluster(
	app: RequestListener | {
		listen: Function
	}
): cluster.ClusterController;

export = cluster;
