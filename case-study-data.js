(() => {
    const projects = {
        '/works/ginza-sushi-restaurant': ['店舗デザインとカウンター・客席の完成イメージ共有', '設計提案・関係者間の完成イメージ共有', 'カウンター・客席の内観CG 2カット'],
        '/works/korean-restaurant': ['客席配置、店内動線、素材・照明の完成イメージ共有', '店舗設計・関係者間の完成イメージ共有', '客席・店内動線の内観CG 2カット'],
        '/works/tower-mansion': ['LDKの家具配置、素材、自然光と眺望の完成イメージ共有', '住宅提案・インテリア検討・施主確認', 'リビング・ダイニング・キッチンの内観CG 3カット'],
        '/works/share-salon': ['受付・待合の動線と内装デザインの完成イメージ共有', '施設設計・関係者間の完成イメージ共有', '受付・待合の内観CG 2カット'],
        '/works/kyoto-kominka': ['既存意匠と改装後の外観・素材の完成イメージ共有', '改装計画・関係者間の完成イメージ共有', '古民家改装の建築CG 1カット'],
        '/works/hotel-lobby': ['ロビーの素材、照明、家具配置の完成イメージ共有', '施設設計・関係者間の完成イメージ共有', 'ホテルロビーの内観CG 1カット'],
        '/works/restaurant-exterior': ['入口・ファサードと営業時の見え方の完成イメージ共有', '出店計画・外装デザイン確認', '飲食店ファサードの外観CG 1カット'],
        '/works/tokyo-bar': ['カウンター・客席と夜間照明の完成イメージ共有', '店舗設計・関係者間の完成イメージ共有', 'BARの内観CG 1カット']
    };
    const path = location.pathname.replace(/\/$/, '');
    const data = projects[path];
    const cta = document.querySelector('main .cta');
    if (!data || !cta || document.querySelector('.project-data-section')) return;
    const fields = [
        ['制作目的', data[0]], ['使用用途', data[1]], ['制作年', '非公開'],
        ['担当範囲', '3Dモデリング、マテリアル・照明設定、レンダリング、画像調整'],
        ['使用ソフト', 'SketchUp、Photoshop、Enscape'], ['制作カット', data[2]],
        ['施設所在地', '非公開'], ['施設名・制作期間', '非公開']
    ];
    const section = document.createElement('section');
    section.className = 'project-data-section';
    const container = document.createElement('div');
    container.className = 'container';
    container.innerHTML = '<div class="content-grid"><div><span class="eyebrow">PROJECT DATA</span><h2>制作情報</h2></div><div class="copy"><p>公開可能な範囲で、本事例の制作内容をまとめています。</p></div></div>';
    const list = document.createElement('dl');
    list.className = 'project-data';
    fields.forEach(([label, value]) => {
        const row = document.createElement('div');
        const term = document.createElement('dt');
        const detail = document.createElement('dd');
        term.textContent = label;
        detail.textContent = value;
        row.append(term, detail);
        list.appendChild(row);
    });
    container.appendChild(list);
    section.appendChild(container);
    cta.before(section);
})();
