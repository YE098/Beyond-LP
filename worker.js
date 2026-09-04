import { onRequestPost as handleContactPost } from './functions/api/contact.js';
import { onRequestGet as handleTurnstileConfigGet } from './functions/api/turnstile-config.js';

const securityHeaders = {
    'Content-Security-Policy': "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'self'; form-action 'self'; img-src 'self' data: https://www.google-analytics.com; font-src 'self' https://fonts.gstatic.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com https://www.googletagmanager.com; connect-src 'self' https://challenges.cloudflare.com https://www.google-analytics.com https://region1.google-analytics.com; frame-src https://challenges.cloudflare.com https://www.google.com https://maps.google.com; upgrade-insecure-requests",
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'SAMEORIGIN',
    'Content-Signal': 'search=yes, ai-input=yes, ai-train=yes'
};

const jsonResponse = (data, status = 200, extraHeaders = {}) => new Response(
    JSON.stringify(data),
    {
        status,
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': 'no-store',
            ...securityHeaders,
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
        if (pathname.endsWith('.html') || !/\.[a-z0-9]+$/i.test(pathname)) {
            headers.set('X-Robots-Tag', 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');
        }
        if (/\.(?:webp|png|jpg|jpeg|gif|svg|ico)$/.test(pathname)) {
            headers.set('Cache-Control', 'public, max-age=604800, stale-while-revalidate=86400');
        } else if (/\.(?:css|js)$/.test(pathname)) {
            headers.set('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
        }
        Object.entries(securityHeaders).forEach(([name, value]) => headers.set(name, value));

        return new Response(assetResponse.body, {
            status: assetResponse.status,
            statusText: assetResponse.statusText,
            headers
        });
    }
};
