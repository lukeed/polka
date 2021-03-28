import type { IncomingMessage } from 'http';
import type { Middleware } from 'polka';

export type Parser = (bits: string | Buffer) => any;

export interface ParseOptions {
	encoding?: string;
	parser?: Parser;
	limit?: number;
	type?: string;
}

function parse<T extends IncomingMessage>(opts?: ParseOptions): Middleware<T>;

export {
	parse,
	parse as json,
	parse as urlencoded,
	parse as text,
	parse as raw
};
