import type { IncomingMessage } from 'http';

declare interface ParsedURL {
	pathname: string;
	search: string;
	query: Record<string, string | string[]> | void;
	raw: string;
}

declare function parse(req: IncomingMessage): ParsedURL;

export = {
	parse
};
