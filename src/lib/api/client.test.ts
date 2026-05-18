import { describe, expect, it } from 'vitest';
import { ApiError } from './errors';

describe('ApiError', () => {
	it('exposes status and message', () => {
		const err = new ApiError('bad request', 400, 'body');
		expect(err.status).toBe(400);
		expect(err.message).toBe('bad request');
		expect(err.body).toBe('body');
		expect(err.name).toBe('ApiError');
	});
});
