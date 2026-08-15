const UPSTREAMS = {
	cdnbeatsaver: 'https://cdn.beatsaver.com',
	'cdn-assets-bl': 'https://cdn.assets.beatleader.xyz',
	steamcommunity: 'https://steamcommunity.com',
	steamapi: 'https://api.steampowered.com',
	blapi: 'https://api.beatleader.xyz',
};

export default {
	async fetch(request, env) {
		const url = new URL(request.url);

		if (url.pathname.startsWith('/cors/')) {
			const segments = url.pathname.slice('/cors/'.length).split('/').filter(s => s.length > 0);
			const upstream = UPSTREAMS[segments[0]];
			if (!upstream) {
				return new Response('Not found', {status: 404});
			}

			const target = upstream + '/' + segments.slice(1).join('/') + url.search;

			const headers = new Headers(request.headers);
			headers.delete('host');

			const resp = await fetch(target, {
				method: request.method,
				headers,
				body: ['GET', 'HEAD'].includes(request.method) ? undefined : request.body,
			});

			const out = new Response(resp.body, resp);
			out.headers.set('Access-Control-Allow-Origin', '*');
			return out;
		}

		return env.ASSETS.fetch(request);
	},
};
