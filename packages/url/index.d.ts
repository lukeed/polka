import type { IncomingMessage } from 'http';

export interface ParsedURL {
	path: string;
	pathname: string;
	search: string | null;
	query: Record<string, string | string[]> | string | null;
	href: string;
	_raw: string;
}

export default function (req: IncomingMessage, toDecode?: boolean): ParsedURL;
