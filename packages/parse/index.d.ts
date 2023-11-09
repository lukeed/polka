import type { IncomingMessage } from 'http';
import type { Middleware } from 'polka';

declare type Parser = (bits: string | Buffer) => any;

declare interface ParseOptions {
	encoding?: string;
	parser?: Parser;
	limit?: number;
	type?: string;
}

declare function parse<T extends IncomingMessage>(opts?: ParseOptions): Middleware<T>;

export = {
	parse,
	json: parse,
	urlencoded: parse,
	text: parse,
	raw: parse
};
