import { ApiError } from '$lib/api/errors';

export function formatApiError(e: unknown): string {
	if (!(e instanceof ApiError)) return String(e);
	const body = e.message.length > 1200 ? `${e.message.slice(0, 1200)}…` : e.message;
	return `HTTP ${e.status}: ${body}`;
}
