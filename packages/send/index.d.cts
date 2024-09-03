import type { ServerResponse } from 'http';

declare namespace send {
	export type OutgoingHeaders = Record<string, string|string[]>;
}

declare function send(
	res: ServerResponse,
	status?: number,
	data?: any,
	headers?: send.OutgoingHeaders
): void;

export = send;
