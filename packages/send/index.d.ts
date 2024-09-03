import type { ServerResponse } from 'http';
export type OutgoingHeaders = Record<string, string|string[]>;
export default function (res: ServerResponse, status?: number, data?: any, headers?: OutgoingHeaders): void;
