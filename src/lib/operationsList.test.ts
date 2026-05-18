import { describe, expect, it } from 'vitest';
import { formatOperationsList, parseOperationsList } from './operationsList';

describe('parseOperationsList', () => {
	it('parses JSON array', () => {
		expect(parseOperationsList('["POST /tests/{testId}/start", "GET /masters"]')).toEqual([
			'POST /tests/{testId}/start',
			'GET /masters'
		]);
	});

	it('parses one operation per line', () => {
		expect(parseOperationsList('POST /tests/{testId}/start\nGET /masters')).toEqual([
			'POST /tests/{testId}/start',
			'GET /masters'
		]);
	});

	it('returns empty for blank input', () => {
		expect(parseOperationsList('')).toEqual([]);
	});
});

describe('formatOperationsList', () => {
	it('formats array as lines', () => {
		expect(formatOperationsList(['GET /a', 'POST /b'])).toBe('GET /a\nPOST /b');
	});
});
