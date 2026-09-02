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

    const initializeSharedNavigation = () => {
        const header = document.querySelector('header');
        if (!header) return;

        header.classList.add('site-header');
        const inner = header.querySelector('.header-content, .nav');
        if (inner) inner.classList.add('site-header-inner');

        let navigation = header.querySelector('nav');
        if (!navigation) {
            navigation = document.createElement('nav');
            inner?.appendChild(navigation);
        }
        navigation.id = 'site-navigation';
        navigation.className = 'site-nav';
        navigation.setAttribute('aria-label', 'メインナビゲーション');
        navigation.innerHTML = `
            <ul class="site-nav-list">
                <li class="site-nav-services">
                    <button type="button" class="site-nav-service-toggle" aria-expanded="false" aria-controls="site-service-menu">サービス<span aria-hidden="true">＋</span></button>
                    <ul class="site-service-menu" id="site-service-menu">
                        <li><a href="/interior-rendering">内観パース制作</a></li>
                        <li><a href="/exterior-rendering">外観パース制作</a></li>
                        <li><a href="/store-rendering">店舗・飲食店CGパース</a></li>
                        <li><a href="/residential-rendering">住宅・マンションCGパース</a></li>
                        <li><a href="/medical-rendering">クリニック・美容施設CGパース</a></li>
                    </ul>
                </li>
                <li><a href="/works">制作実績</a></li>
                <li><a href="/pricing-guide">料金・納期</a></li>
                <li><a href="/about">事業者情報</a></li>
                <li><a class="site-nav-contact" href="/#contact">見積もりを相談</a></li>
            </ul>`;

        let menuToggle = header.querySelector('.menu-toggle');
        const addedToggle = !menuToggle;
        if (!menuToggle) {
            menuToggle = document.createElement('button');
            menuToggle.className = 'menu-toggle site-menu-toggle';
            menuToggle.type = 'button';
            menuToggle.setAttribute('aria-label', 'メニューを開く');
            menuToggle.setAttribute('aria-controls', 'site-navigation');
            menuToggle.setAttribute('aria-expanded', 'false');
            menuToggle.innerHTML = '<span></span><span></span><span></span>';
            inner?.appendChild(menuToggle);
        } else {
            menuToggle.setAttribute('aria-controls', 'site-navigation');
        }

        const serviceToggle = navigation.querySelector('.site-nav-service-toggle');
        const closeServiceMenu = () => {
            header.classList.remove('service-menu-open');
            serviceToggle.setAttribute('aria-expanded', 'false');
        };
        serviceToggle.addEventListener('click', event => {
            event.stopPropagation();
            const open = header.classList.toggle('service-menu-open');
            serviceToggle.setAttribute('aria-expanded', String(open));
        });

        if (addedToggle) {
            menuToggle.addEventListener('click', () => {
                const open = header.classList.toggle('menu-open');
                document.body.classList.toggle('menu-open', open);
                menuToggle.setAttribute('aria-expanded', String(open));
                menuToggle.setAttribute('aria-label', open ? 'メニューを閉じる' : 'メニューを開く');
                if (!open) closeServiceMenu();
            });
        }

        navigation.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
            header.classList.remove('menu-open');
            document.body.classList.remove('menu-open');
            menuToggle.setAttribute('aria-expanded', 'false');
            closeServiceMenu();
        }));
        document.addEventListener('click', event => {
            if (!event.target.closest('.site-nav-services')) closeServiceMenu();
        });
        document.addEventListener('keydown', event => {
            if (event.key === 'Escape') closeServiceMenu();
        });
    };

    const initializeMobileContact = () => {
        if (document.querySelector('.mobile-sticky-cta')) return;
        const link = document.createElement('a');
        link.className = 'mobile-sticky-cta';
        link.href = window.location.pathname === '/' ? '#contact' : '/#contact';
        link.textContent = '見積もりを相談';
        link.setAttribute('aria-label', '見積もりフォームへ移動');
        document.body.appendChild(link);
    };

    document.addEventListener('DOMContentLoaded', () => {
        initializeSharedNavigation();
        initializeMobileContact();
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
