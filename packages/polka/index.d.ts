import type { IncomingMessage, ServerResponse } from 'http';
import type { ListenOptions, Server } from 'net';
import type { ParsedURL } from '@polka/url';
import type Trouter from 'trouter';

type Promisable<T> = Promise<T> | T;
type ListenCallback = () => Promisable<void>;

export interface IError extends Error {
	code?: number;
	status?: number;
	details?: any;
}

export type NextHandler = (err?: string | IError) => Promisable<void>;
export type ErrorHandler<T extends Request = Request> = (err: string | IError, req: T, res: Response, next: NextHandler) => Promisable<void>;
export type Middleware<T extends IncomingMessage = Request> = (req: T & Request, res: Response, next: NextHandler) => Promisable<void>;

export interface IOptions<T extends Request = Request> {
	server?: Server;
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
	readonly server: Server;
	readonly wares: Middleware<T>[];

	readonly onError: ErrorHandler<T>;
	readonly onNoMatch: Middleware<T>;

	readonly handler: Middleware<T>;
	parse: (req: IncomingMessage) => ParsedURL;

	use(pattern: RegExp|string, ...handlers: (Polka<T> | Middleware<T>)[]): this;
	use(...handlers: (Polka<T> | Middleware<T>)[]): this;

	listen(port?: number, hostname?: string, backlog?: number, callback?: ListenCallback): this;
	listen(port?: number, hostname?: string, callback?: ListenCallback): this;
	listen(port?: number, backlog?: number, callback?: ListenCallback): this;
	listen(port?: number, callback?: ListenCallback): this;
	listen(path: string, backlog?: number, callback?: ListenCallback): this;
	listen(path: string, callback?: ListenCallback): this;
	listen(options: ListenOptions, callback?: ListenCallback): this;
	listen(handle: any, backlog?: number, callback?: ListenCallback): this;
	listen(handle: any, callback?: ListenCallback): this;
}

export default function <T extends Request = Request> (options?: IOptions<T>): Polka<T>;
