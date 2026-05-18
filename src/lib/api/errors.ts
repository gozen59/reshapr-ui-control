export class ApiError extends Error {
	readonly status: number;
	readonly body: string | undefined;

	constructor(message: string, status: number, body?: string) {
		super(message);
		this.name = 'ApiError';
		this.status = status;
		this.body = body;
	}
}
