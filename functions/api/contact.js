const MAX_BODY_BYTES = 32_000;
const FIELD_LIMITS = {
    name: 100,
    company: 150,
    email: 254,
    phone: 40,
    service: 100,
    message: 5_000,
    website: 200,
    turnstileToken: 2_500
};

const jsonResponse = (data, status = 200) => new Response(JSON.stringify(data), {
    status,
    headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff'
    }
});

const normalize = (value, maxLength) => String(value ?? '').trim().slice(0, maxLength);

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const verifyTurnstile = async ({ secret, token, remoteIp }) => {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            secret,
            response: token,
            remoteip: remoteIp
        })
    });

    if (!response.ok) return { success: false };
    return response.json();
};

const buildEmailText = ({ name, company, email, phone, service, message }) => [
    'Beyond CG Studio Webサイトからお問い合わせが届きました。',
    '',
    `お名前: ${name}`,
    `会社名・屋号: ${company || '未入力'}`,
    `メールアドレス: ${email}`,
    `電話番号: ${phone || '未入力'}`,
    `ご希望のサービス: ${service}`,
    '',
    'ご相談内容:',
    message
].join('\n');

export const onRequestPost = async ({ request, env }) => {
    const requiredConfig = [
        'TURNSTILE_SECRET_KEY',
        'RESEND_API_KEY',
        'CONTACT_TO_EMAIL',
        'CONTACT_FROM_EMAIL'
    ];

    if (requiredConfig.some(key => !env[key])) {
        console.error('Contact form environment variables are incomplete.');
        return jsonResponse({ error: '現在フォームをご利用いただけません。メールでお問い合わせください。' }, 503);
    }

    const contentLength = Number(request.headers.get('Content-Length') || 0);
    if (contentLength > MAX_BODY_BYTES) {
        return jsonResponse({ error: '送信内容が大きすぎます。' }, 413);
    }

    let raw;
    try {
        raw = await request.json();
    } catch {
        return jsonResponse({ error: '送信内容を確認してください。' }, 400);
    }

    const data = Object.fromEntries(
        Object.entries(FIELD_LIMITS).map(([key, limit]) => [key, normalize(raw[key], limit)])
    );

    if (data.website) {
        return jsonResponse({ success: true });
    }

    if (!data.name || !data.email || !data.service || !data.message || !data.turnstileToken) {
        return jsonResponse({ error: '必須項目を入力してください。' }, 400);
    }

    if (!isValidEmail(data.email)) {
        return jsonResponse({ error: 'メールアドレスを確認してください。' }, 400);
    }

    const remoteIp = request.headers.get('CF-Connecting-IP') || '';
    let turnstileResult;
    try {
        turnstileResult = await verifyTurnstile({
            secret: env.TURNSTILE_SECRET_KEY,
            token: data.turnstileToken,
            remoteIp
        });
    } catch (error) {
        console.error('Turnstile verification failed:', error);
        return jsonResponse({ error: 'セキュリティ確認に失敗しました。時間をおいてお試しください。' }, 502);
    }

    const allowedHostnames = String(env.ALLOWED_HOSTNAME || '')
        .split(',')
        .map(hostname => hostname.trim())
        .filter(Boolean);
    const hostnameMatches = allowedHostnames.length === 0 || allowedHostnames.includes(turnstileResult.hostname);
    const actionMatches = !turnstileResult.action || turnstileResult.action === 'contact';
    if (!turnstileResult.success || !hostnameMatches || !actionMatches) {
        return jsonResponse({ error: 'セキュリティ確認を完了してください。' }, 400);
    }

    const emailResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${env.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
            'Idempotency-Key': `contact-${crypto.randomUUID()}`
        },
        body: JSON.stringify({
            from: env.CONTACT_FROM_EMAIL,
            to: [env.CONTACT_TO_EMAIL],
            reply_to: data.email,
            subject: `【Webサイトお問い合わせ】${data.service} / ${data.name}様`,
            text: buildEmailText(data)
        })
    });

    if (!emailResponse.ok) {
        const errorBody = await emailResponse.text();
        console.error('Resend API error:', emailResponse.status, errorBody);
        return jsonResponse({ error: '送信できませんでした。時間をおいて再度お試しください。' }, 502);
    }

    return jsonResponse({ success: true });
};
