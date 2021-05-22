import type { IncomingMessage } from 'http';
import type { ParsedUrlQuery } from 'querystring';

export interface ParsedURL {
	pathname: string;
	search: string;
	query: Record<string, string | string[]> | void;
	raw: string;
}

export default function (req: IncomingMessage, toDecode?: boolean): ParsedURL;
