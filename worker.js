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

        if (
            url.protocol !== 'https:'
            || url.hostname === 'www.beyondcgstudio.com'
            || url.hostname === 'lp.beyondinfo856.workers.dev'
        ) {
            url.protocol = 'https:';
            url.hostname = 'beyondcgstudio.com';
            return Response.redirect(url.toString(), 308);
        }

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

        const assetResponse = await env.ASSETS.fetch(request);
        if (!assetResponse.ok || !['GET', 'HEAD'].includes(request.method)) return assetResponse;

        const headers = new Headers(assetResponse.headers);
        const pathname = url.pathname.toLowerCase();
        if (/\.(?:webp|png|jpg|jpeg|gif|svg|ico)$/.test(pathname)) {
            headers.set('Cache-Control', 'public, max-age=604800, stale-while-revalidate=86400');
        } else if (/\.(?:css|js)$/.test(pathname)) {
            headers.set('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
        }
        headers.set('X-Content-Type-Options', 'nosniff');
        headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
        headers.set('X-Frame-Options', 'SAMEORIGIN');

        return new Response(assetResponse.body, {
            status: assetResponse.status,
            statusText: assetResponse.statusText,
            headers
        });
    }
};
