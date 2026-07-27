import { onRequestPost as handleContactPost } from './functions/api/contact.js';
import { onRequestGet as handleTurnstileConfigGet } from './functions/api/turnstile-config.js';

const jsonResponse = (data, status = 200, extraHeaders = {}) => new Response(
    JSON.stringify(data),
    {
        status,
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': 'no-store',
            'X-Content-Type-Options': 'nosniff',
            ...extraHeaders
        }
    }
);

const methodNotAllowed = (allowed) => jsonResponse(
    { error: '許可されていない送信方法です。' },
    405,
    { Allow: allowed }
);

export default {
    async fetch(request, env) {
        const url = new URL(request.url);

        if (url.pathname === '/api/contact') {
            if (request.method !== 'POST') return methodNotAllowed('POST');
            return handleContactPost({ request, env });
        }

        if (url.pathname === '/api/turnstile-config') {
            if (request.method !== 'GET') return methodNotAllowed('GET');
            return handleTurnstileConfigGet({ request, env });
        }

        if (url.pathname.startsWith('/api/')) {
            return jsonResponse({ error: 'APIが見つかりません。' }, 404);
        }

        return env.ASSETS.fetch(request);
    }
};
