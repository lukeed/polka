import type { RequestListener } from 'http';

export interface ClusterController {
	listen(port: number): void;
}

export default function (app: RequestListener | { listen: Function }): ClusterController;
