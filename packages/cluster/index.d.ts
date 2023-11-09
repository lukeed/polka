import type { RequestListener } from 'http';

declare interface ClusterController {
	listen(port: number): void;
}

declare function controller(app: RequestListener | { listen: Function }): ClusterController;

export = controller;
