import type { ServiceRecord } from '$lib/serviceHub';

export const SERVICE_CONTEXT_KEY = Symbol('service-context');

export type ServiceContextValue = {
	id: string;
	service: ServiceRecord | null;
	raw: unknown;
	loading: boolean;
	error: string | null;
	refresh: () => Promise<void>;
};
