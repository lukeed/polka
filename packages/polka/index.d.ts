import type { Server } from 'net';
import type { IncomingMessage, ServerResponse } from 'http';
import type { ParsedURL } from '@polka/url';
import type Trouter from 'trouter';

type Promisable<T> = Promise<T> | T;

export interface IError extends Error {
	code?: number;
	status?: number;
	details?: any;
}

export type NextHandler = (err?: string | IError) => Promisable<void>;
export type ErrorHandler<T extends Request = Request> = (err: string | IError, req: T, res: Response, next: NextHandler) => Promisable<void>;
export type Middleware<T extends IncomingMessage = Request> = (req: T & Request, res: Response, next: NextHandler) => Promisable<void>;

export interface IOptions<T extends Request = Request> {
	server?: typeof Server;
	onNoMatch?: Middleware<T>;
	onError?: ErrorHandler<T>;
}

export type Response = ServerResponse;

export interface Request extends IncomingMessage, ParsedURL {
	url: string;
	method: string;
	originalUrl: string;
	params: Record<string, string>;
	body?: any;
	_decoded?: true;
	_parsedUrl: ParsedURL;
}

export interface Polka<T extends Request = Request> extends Trouter<Middleware<T>> {
	readonly server: typeof Server;
	readonly wares: Middleware<T>[];

	readonly onError: ErrorHandler<T>;
	readonly onNoMatch: Middleware<T>;

	readonly handler: Middleware<T>;
	parse: (req: IncomingMessage) => ParsedURL;
	use(pattern: string, ...handlers: (Polka<T> | Middleware<T>)[]): this;
	use(...handlers: (Polka<T> | Middleware<T>)[]): this;
	listen: Server['listen'];
}

export default function <T extends Request = Request> (options?: IOptions<T>): Polka<T>;
