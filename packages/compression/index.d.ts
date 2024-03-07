import type { IncomingMessage, ServerResponse } from 'node:http';

declare namespace compression {
	export type Options = {
		/**
		 * Don't compress responses below this size (in bytes).
		 * @default 1024
		 */
		threshold?: number;
		/**
		 * Gzip/Brotli compression effort (1-11, or -1 for default)
		 * @default -1
		 */
		level?: number;
		/**
		 * Generate and serve Brotli-compressed responses.
		 * @default false
		 */
		brotli?: boolean;
		/**
		 * Generate and serve Gzip-compressed responses.
		 * @default true
		 */
		gzip?: boolean;
		/**
		 * Regular expression of response MIME types to compress.
		 * @default /text|javascript|\/json|xml/i
		 */
		mimes?: RegExp;
	};

	export type Middleware = (
		request: Pick<IncomingMessage, 'method' | 'headers'>,
		response: ServerResponse,
		next?: (error?: Error | string) => any,
	) => void;
}

declare function compression(options?: compression.Options): compression.Middleware;

export = compression;
