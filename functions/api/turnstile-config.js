const jsonResponse = (data, status = 200) => new Response(JSON.stringify(data), {
    status,
    headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store'
    }
});

export const onRequestGet = async ({ env }) => {
    if (!env.TURNSTILE_SITE_KEY) {
        return jsonResponse({ error: 'Turnstile is not configured.' }, 503);
    }

    return jsonResponse({ siteKey: env.TURNSTILE_SITE_KEY });
};
