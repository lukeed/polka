import type { ServerResponse } from 'http';

declare function redirect(res: ServerResponse, code?: number, location?: string): void;

export = redirect;
