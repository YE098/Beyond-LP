(() => {
    const measurementId = 'G-GP2R1LXC3E';
    const consentKey = 'bcg_analytics_consent';
    const workContactContext = {
        '/works/dental-clinic': ['歯科医院の待合室・内観CGパース', '内観パース', 'クリニック・美容施設'],
        '/works/ginza-sushi-restaurant': ['銀座の寿司店 内観CGパース', '内観パース', '店舗・飲食店'],
        '/works/korean-restaurant': ['韓国料理店 内観CGパース', '内観パース', '店舗・飲食店'],
        '/works/tower-mansion': ['タワーマンション 内観CGパース', '内観パース', '住宅・マンション'],
        '/works/share-salon': ['シェアサロン 受付・待合CGパース', '内観パース', 'クリニック・美容施設'],
        '/works/kyoto-kominka': ['京都の古民家改装 建築CGパース', '外観パース', '住宅・マンション'],
        '/works/hotel-lobby': ['ホテルロビー 内観CGパース', '内観パース', 'ホテル・宿泊施設'],
        '/works/restaurant-exterior': ['飲食店ファサード 外観CGパース', '外観パース', '店舗・飲食店'],
        '/works/tokyo-bar': ['東京のBAR 内観CGパース', '内観パース', '店舗・飲食店']
    };
    let loaded = false;

    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };

    const getConsent = () => {
        try { return window.localStorage.getItem(consentKey); } catch { return null; }
    };

    const setConsent = (value) => {
        try { window.localStorage.setItem(consentKey, value); } catch { /* storage unavailable */ }
    };

    const loadAnalytics = () => {
        if (loaded || getConsent() !== 'granted') return;
        loaded = true;
        const script = document.createElement('script');
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
        document.head.appendChild(script);
        window.gtag('js', new Date());
        window.gtag('config', measurementId, { anonymize_ip: true });
    };

    window.trackAnalyticsEvent = (name, parameters = {}) => {
        if (getConsent() !== 'granted') return;
        loadAnalytics();
        window.gtag('event', name, parameters);
    };

    const createConsentBanner = () => {
        if (document.getElementById('analytics-consent')) return;
        const banner = document.createElement('div');
        banner.id = 'analytics-consent';
        banner.className = 'analytics-consent';
        banner.setAttribute('role', 'dialog');
        banner.setAttribute('aria-label', 'アクセス解析の設定');
        banner.innerHTML = `
            <p>サイト改善のため、同意いただいた場合のみGoogle Analyticsで匿名の利用状況を計測します。<a href="/privacy">詳細</a></p>
            <div class="analytics-consent-actions">
                <button type="button" data-analytics-consent="denied">拒否する</button>
                <button type="button" class="primary" data-analytics-consent="granted">同意する</button>
            </div>`;
        document.body.appendChild(banner);
        banner.querySelectorAll('[data-analytics-consent]').forEach(button => {
            button.addEventListener('click', () => {
                const choice = button.dataset.analyticsConsent;
                setConsent(choice);
                banner.remove();
                if (choice === 'granted') loadAnalytics();
            });
        });
    };

    const showConsentSettings = () => {
        document.getElementById('analytics-consent')?.remove();
        createConsentBanner();
    };

    document.addEventListener('DOMContentLoaded', () => {
        const consent = getConsent();
        if (consent === 'granted') loadAnalytics();
        if (!consent) createConsentBanner();

        const pagePath = window.location.pathname.replace(/\/$/, '');
        const contactContext = workContactContext[pagePath];
        if (contactContext) {
            const [work, service, projectType] = contactContext;
            const params = new URLSearchParams({ work, service, projectType });
            document.querySelectorAll('.cta a[href="/#contact"]').forEach(link => {
                link.href = `/?${params.toString()}#contact`;
                link.dataset.work = work;
                link.dataset.service = service;
            });
        }

        document.querySelectorAll('[data-analytics-settings]').forEach(button => {
            button.addEventListener('click', showConsentSettings);
        });

        document.addEventListener('click', event => {
            const link = event.target.closest('a');
            if (link) {
                const href = link.getAttribute('href') || '';
                if (href.startsWith('mailto:')) window.trackAnalyticsEvent('contact_email_click');
                if (href.startsWith('tel:')) window.trackAnalyticsEvent('contact_phone_click');
                if (href.includes('#contact')) {
                    window.trackAnalyticsEvent('contact_cta_click', {
                        link_text: link.textContent.trim().slice(0, 80),
                        work_title: link.dataset.work || '',
                        service: link.dataset.service || ''
                    });
                }
            }

            const work = event.target.closest('.work');
            if (work) {
                window.trackAnalyticsEvent('select_content', {
                    content_type: 'work',
                    item_id: (work.querySelector('strong')?.textContent || 'work').trim().slice(0, 80)
                });
            }
        });
    });
})();

if (/^\/works\/(?!dental-clinic\/?$)[a-z0-9-]+\/?$/.test(window.location.pathname)) {
    const caseStudyScript = document.createElement('script');
    caseStudyScript.src = '/case-study-data.js';
    caseStudyScript.defer = true;
    document.head.appendChild(caseStudyScript);
}
