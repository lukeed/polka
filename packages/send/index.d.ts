import type { ServerResponse } from 'http';

declare type OutgoingHeaders = Record<string, string|string[]>;

declare function send(res: ServerResponse, status?: number, data?: any, headers?: OutgoingHeaders): void;

export = send;
