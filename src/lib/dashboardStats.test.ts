import { describe, expect, it } from 'vitest'
import {
	aggregateGatewaysFromActiveExpositions,
	buildGatewayRegisteredDetail,
	quotaEntry
} from './dashboardStatsCompute'

describe('quotaEntry', () => {
	it('computes used from limit and remaining', () => {
		expect(
			quotaEntry([{ metric: 'gateway.count', limit: 5, remaining: 2, enabled: true }], 'gateway.count')
		).toEqual({ used: 3, limit: 5, remaining: 2 })
	})
})

describe('aggregateGatewaysFromActiveExpositions', () => {
	it('dedupes gateways by id across expositions', () => {
		const active = [
			{
				id: 'expo-a',
				gateways: [{ id: 'gw-1', name: 'one', fqdns: ['a.example.com'] }]
			},
			{
				id: 'expo-b',
				gateways: [
					{ id: 'gw-1', name: 'one', fqdns: [] },
					{ id: 'gw-2', name: 'two', fqdns: ['b.example.com'] }
				]
			}
		]
		const r = aggregateGatewaysFromActiveExpositions(active)
		expect(r.registered).toBe(2)
		expect(r.healthy).toBe(2)
		expect(r.gateways).toHaveLength(2)
		expect(r.gateways[0]?.onActiveExpositions).toEqual(['expo-a', 'expo-b'])
	})

	it('uses name as key when id is missing', () => {
		const r = aggregateGatewaysFromActiveExpositions([
			{ id: 'expo-1', gateways: [{ name: 'edge-1', fqdns: [] }] }
		])
		expect(r.registered).toBe(1)
		expect(r.gateways[0]?.key).toBe('edge-1')
	})
})

describe('buildGatewayRegisteredDetail', () => {
	it('prefers quota when higher than active exposition count', () => {
		const d = buildGatewayRegisteredDetail(
			[{ id: 'expo-1', gateways: [{ id: 'gw-1', fqdns: ['x'] }] }],
			[{ metric: 'gateway.count', limit: 10, remaining: 4 }]
		)
		expect(d.displayedCount).toBe(6)
		expect(d.source).toBe('quota_only')
		expect(d.quota?.used).toBe(6)
		expect(d.fromActiveExpositions.registered).toBe(1)
	})
})
