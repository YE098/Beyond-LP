(() => {
    // 掲載許可を得た実在する感想だけを追加してください。
    // clientLabel は「設計事務所ご担当者様」など、許可された表記を使用します。
    const testimonials = [];

    const section = document.getElementById('testimonials');
    const list = document.getElementById('testimonials-list');
    if (!section || !list || testimonials.length === 0) return;

    const fragment = document.createDocumentFragment();
    testimonials.forEach(({ quote, clientLabel, project, workUrl }) => {
        if (!quote || !clientLabel || !project) return;

        const article = document.createElement('article');
        article.className = 'testimonial-card reveal';

        const text = document.createElement('blockquote');
        text.textContent = quote;
        article.appendChild(text);

        const meta = document.createElement('p');
        meta.className = 'testimonial-meta';
        meta.textContent = `${clientLabel}｜${project}`;
        article.appendChild(meta);

        if (workUrl) {
            const link = document.createElement('a');
            link.className = 'testimonial-link';
            link.href = workUrl;
            link.textContent = '関連する制作実績を見る';
            article.appendChild(link);
        }

        fragment.appendChild(article);
    });

    if (!fragment.childNodes.length) return;
    list.appendChild(fragment);
    section.hidden = false;
})();
