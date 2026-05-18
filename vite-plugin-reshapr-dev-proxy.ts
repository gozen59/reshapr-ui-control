import http from 'node:http';
import https from 'node:https';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Plugin } from 'vite';

const LOCAL_DEFAULT = 'http://localhost:5555';
const TARGET_HEADER = 'x-reshapr-control-plane';

function isValidTarget(value: string): string | null {
	try {
		const u = new URL(value);
		if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
		if (!u.hostname) return null;
		return u.origin;
	} catch {
		return null;
	}
}

function shouldProxy(pathname: string): boolean {
	return pathname.startsWith('/api') || pathname.startsWith('/auth');
}

function setDevCors(req: IncomingMessage, res: ServerResponse) {
	const origin = req.headers.origin;
	if (origin) {
		res.setHeader('Access-Control-Allow-Origin', origin);
		res.setHeader('Access-Control-Allow-Credentials', 'true');
	}
	res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
	res.setHeader(
		'Access-Control-Allow-Headers',
		'Authorization, Content-Type, X-Reshapr-Control-Plane'
	);
}

function proxyRequest(
	req: IncomingMessage,
	res: ServerResponse,
	targetOrigin: string,
	pathAndQuery: string
) {
	const target = new URL(pathAndQuery, targetOrigin);
	const transport = target.protocol === 'https:' ? https : http;

	const headers = { ...req.headers };
	delete headers[TARGET_HEADER];
	headers.host = target.host;

	const proxyReq = transport.request(
		{
			protocol: target.protocol,
			hostname: target.hostname,
			port: target.port || (target.protocol === 'https:' ? 443 : 80),
			method: req.method,
			path: `${target.pathname}${target.search}`,
			headers
		},
		(proxyRes) => {
			setDevCors(req, res);
			res.writeHead(proxyRes.statusCode ?? 502, proxyRes.headers);
			proxyRes.pipe(res);
		}
	);

	proxyReq.on('error', () => {
		setDevCors(req, res);
		res.statusCode = 502;
		res.end('Bad gateway (dev proxy could not reach control plane)');
	});

	req.pipe(proxyReq);
}

/** Dev-only: proxy /api and /auth to localhost:5555 or X-Reshapr-Control-Plane (SaaS, no browser CORS). */
export function reshaprDevProxy(): Plugin {
	return {
		name: 'reshapr-dev-proxy',
		apply: 'serve',
		configureServer(server) {
			server.middlewares.use((req, res, next) => {
				const url = req.url ?? '/';
				const pathname = url.split('?')[0] ?? '/';
				if (!shouldProxy(pathname)) {
					next();
					return;
				}

				if (req.method === 'OPTIONS') {
					setDevCors(req, res);
					res.statusCode = 204;
					res.end();
					return;
				}

				const headerTarget = req.headers[TARGET_HEADER];
				const target =
					(typeof headerTarget === 'string' && isValidTarget(headerTarget)) || LOCAL_DEFAULT;

				proxyRequest(req, res, target, url);
			});
		}
	};
}
