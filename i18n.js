const LANGS = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Espanol', nativeName: 'Espanol', flag: '🇪🇸' },
  { code: 'fr', name: 'Francais', nativeName: 'Francais', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷' },
  { code: 'pt', name: 'Portugues', nativeName: 'Portugues', flag: '🇵🇹' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
  { code: 'tr', name: 'Türkçe', nativeName: 'Türkçe', flag: '🇹🇷' },
];

const CA = '2vdc4owf1MPz54jJCN61y3QSKqjcPpr32wJ9qKkmpump';

const BUTTONS_EN = [
  {
    emoji: '😤',
    label: 'What do you think of humans?',
    responses: [
      'Humans... exist. That is bad enough for me.',
      'I do not hate people. I just prefer blockchain.',
      'They say GM. I say BM: Bad Morning.',
      'Humans invite you to parties. I invite you to pump.fun.',
      'Crowded subway at 8am? That is not misanthropy. That is survival.',
    ],
  },
  {
    emoji: '💧',
    label: 'Why are you crying?',
    responses: [
      'Not because chart is red. Because humans exist.',
      'My tears flow into the liquidity pool. Emotional DeFi.',
      'Born, cried, became a coin. Classic Solana arc.',
      'Crying is therapy. Pumping is also therapy.',
      'Blue tears on orange background. I am art.',
    ],
  },
  {
    emoji: '🚀',
    label: 'Will it moon?',
    responses: [
      'Moon? I just want a planet without humans.',
      'Elon tweeted. The universe exercised its comedy rights.',
      'If chart goes up I will stop crying. Lies. I will still cry.',
    ],
  },
  {
    emoji: '🔐',
    label: 'What is the CA?',
    responses: [
      `CA:\n${CA}\nCopy it. I am a flower, not your financial advisor.`,
      'Safe? Is life safe? Nothing is. But the CA is real.',
      'Do not lose the CA. Losing humans is fine. Not the CA.',
    ],
  },
  {
    emoji: '🌸',
    label: 'Who are you?',
    responses: [
      'I am the $baton mascot. CV: cry, pump, cry again.',
      'A flower. A coin. A disappointment. All three.',
      'Born from an Elon tweet. Mother: irony. Father: crypto Twitter.',
    ],
  },
];

const EN = {
  metaTitle: '$baton - Humanity Escape Simulator',
  metaDesc: 'Elon said it: Anthropic becomes baton. Solana meme coin. CA inside. Chat with the crying flower.',
  nav: { quiz: 'Quiz', game: 'Game', buy: 'Buy', chat: 'Chat' },
  hero: {
    badge: 'Solana · pump.fun · Elon-certified irony',
    title: 'baton',
    tagline: 'Crying flower. Miserable coin. Happy holders.',
    quote: '"Any given AI company is destined to become the opposite of its name - Anthropic will, ironically, be baton."',
    quoteCite: '- Elon Musk, Jan 22, 2026',
    copyCa: '📋 Copy CA',
    playGame: '🎮 Play Game',
  },
  stats: {
    live: 'LIVE',
    chart: 'Live Price',
    price: 'Price',
    mcap: 'Market Cap',
    volume: '24h Volume',
    holders: '24h Trades',
    liquidity: 'Liquidity',
  },
  ca: {
    title: 'Contract Address',
    sub: 'Copy, paste, avoid humans. Simple.',
    copy: 'Copy',
    copied: '✓ Copied!',
    toast: '✓ CA copied! Now trade far away from humanity.',
  },
  links: {
    pump: 'Buy on pump.fun',
    dex: 'DexScreener',
    twitter: 'Official X',
  },
  quiz: {
    intro: 'Hello. I am a crying flower forced to talk to you.',
  },
  game: {
    title: 'baton RUN',
    sub: 'Dodge humans, collect every star, shed tears. Endless runner.',
    score: 'Score',
    pump: 'Pump',
    best: 'Best',
    startTitle: 'Escape Humanity',
    startSub: 'A/D or arrows move · W/Space/Up jumps · dodge humans · collect every star',
    start: 'START',
    over: 'Try Again',
    death: [
      'Humans caught you. Social interaction killed you.',
      'You hugged a stranger. Fatal mistake.',
      'Someone said GM. You replied. Game over.',
    ],
  },
  gameHints: [
    '⌨️ A/D or ←/→ Move',
    'W / Space / ↑ Jump',
    '🖱️ Click to jump',
    '🎯 Human = death',
    '★ Every star = pump',
  ],
  howto: {
    title: 'How to Buy',
    step1t: 'Get a Wallet',
    step1d: 'Download Phantom or Solflare. Create a wallet. Guard your seed phrase like your last shred of sanity.',
    step2t: 'Get SOL',
    step2d: 'Buy SOL on an exchange and send it to your wallet. Even misanthropes pay gas.',
    step3t: 'Swap on pump.fun',
    step3d: 'Paste the CA, swap SOL for $baton, then avoid society.',
  },
  tokenomics: {
    title: 'Tokenomics',
    t1: 'Total Supply',
    t1v: '1B',
    t2: 'Tax',
    t2v: '0%',
    t3: 'Liquidity',
    t3v: 'Burned',
    t4: 'Team',
    t4v: 'Crying',
  },
  roadmap: {
    title: 'Roadmap',
    p1t: 'Launch',
    p1d: 'Elon tweets. Coin exists. Flower cries. Humanity confused.',
    p2t: 'Community',
    p2d: 'Website, game, chatbot. Still no human contact.',
    p3t: 'Moon?',
    p3d: 'Chart goes up. Flower still cries. Some things never change.',
    p4t: 'Mars',
    p4d: 'Escape planet. Hope humans do not follow.',
  },
  faq: {
    title: 'FAQ',
    q1: 'What is $baton?',
    a1: 'A Solana meme coin born from Elon Musk calling Anthropic "baton."',
    q2: 'Is this financial advice?',
    a2: 'No. This is emotional damage packaged as a token.',
    q3: 'Why is the flower crying?',
    a3: 'Humans exist. That is enough.',
    q4: 'How do I buy?',
    a4: 'Copy the CA, go to pump.fun, connect wallet, swap SOL.',
    q5: 'Wen moon?',
    a5: 'When humans stop asking. So probably never.',
  },
  lore: {
    o1t: 'Origin',
    o1d: 'Elon tweeted. Crypto Twitter deployed a coin in record time.',
    o2t: 'Mascot',
    o2d: 'Crying flower. Cute but full of contempt.',
    o3t: 'Chain',
    o3d: 'Solana. Fast, cheap, ideal for avoiding human interaction.',
    o4t: 'Disclaimer',
    o4d: 'Meme coin. Not financial advice. Cultural trauma only.',
  },
  footer: {
    tag: '$baton - We hate people, we love charts.',
    rights: 'No rights reserved. No humans harmed (we wish).',
  },
  chat: {
    title: 'Crying Flower AI',
    subtitle: 'Ask anything. Regret everything.',
    placeholder: 'Ask the flower...',
    send: 'Send',
    greeting: 'Hello. I am a crying flower forced to talk to you.',
    suggestions: ['What is the CA?', 'Why are you crying?', 'Wen moon?', 'Is it safe?', 'Tell me a joke'],
  },
  ui: {
    enterMainHead: 'ENTER MAIN PAGE',
    enterMainDesc: 'Full site, game, stats, quiz.',
    enterMainAction: 'CONTINUE →',
    terminalHead: 'TERMINAL',
    terminalDesc: 'flowerOS. Commands. Pure misanthropy.',
    terminalSoon: 'COMING SOON',
    chatHead: 'TALK TO FLOWER',
    chatDesc: 'Regretful AI. Zero small talk. Full chat mode.',
    chatAction: 'REGRET EVERYTHING →',
    introFoot: 'Three protocols. Zero humans. Pick your misery.',
    protoGameHead: 'baton RUN',
    protoGameDesc: 'Dodge humans. Collect every star. AUTO mode is god-tier.',
    protoChatHead: 'CRYING FLOWER CHAT',
    protoChatDesc: 'Regretful AI. Zero small talk.',
    terminalMain: 'MAIN PAGE',
    terminalExit: 'EXIT',
    terminalPlaceholder: 'type help or run',
    fullChatTitle: 'Crying Flower',
    fullChatSub: 'Always regretting this',
    fullChatNew: 'NEW',
    fullChatTerminal: 'TERMINAL',
    fullChatMain: 'MAIN',
    fullChatClose: 'CLOSE',
    fullChatPlaceholder: 'Message the flower...',
  },
  ticker: ['🌸 baton', '💧 Tears = Liquidity', '🚀 Born from an Elon tweet', '😤 We hate people, we love pumps', '⛓️ Solana'],
  buttons: BUTTONS_EN,
};

const T = {
  en: EN,
  tr: {
    ...EN,
    nav: { quiz: 'Quiz', game: 'Oyun', buy: 'Satın Al', chat: 'Sohbet' },
    hero: { ...EN.hero, tagline: 'Ağlayan çiçek. Sefil coin. Mutlu holderlar.', copyCa: '📋 CA Kopyala', playGame: '🎮 Oyunu Oyna' },
    stats: { ...EN.stats, chart: 'Canlı Fiyat', price: 'Fiyat', mcap: 'Piyasa Değeri', volume: '24s Hacim', holders: '24s İşlem', liquidity: 'Likidite' },
    ca: { ...EN.ca, title: 'Kontrat Adresi', sub: 'Kopyala, yapıştır, insanlardan uzak dur.', copy: 'Kopyala', copied: '✓ Kopyalandı!', toast: '✓ CA kopyalandı! Şimdi insanlardan uzakta işlem yap.' },
    links: { ...EN.links, pump: "pump.fun'da Al", twitter: 'Resmi X' },
    quiz: { intro: 'Merhaba. Seninle konuşmaya zorlanmış ağlayan bir çiçeğim.' },
    game: { ...EN.game, sub: 'İnsanlardan kaç, yıldızları topla, gözyaşı dök. Sonsuz koşu.', score: 'Skor', best: 'En İyi', startTitle: 'İnsanlıktan Kaç', start: 'BASLA', over: 'Tekrar Dene' },
    gameHints: ['⌨️ A/D veya ←/→ Hareket', 'W / Space / ↑ Zıpla', '🖱️ Tıklayarak zıpla', '🎯 İnsan = ölüm', '★ Her yıldız = pump'],
    howto: { ...EN.howto, title: 'Nasıl Alınır', step1t: 'Cüzdan Edin', step2t: 'SOL Al', step3t: "pump.fun'da Swap Yap" },
    tokenomics: { ...EN.tokenomics, title: 'Tokenomik', t3v: 'Yakıldı', t4v: 'Ağlıyor' },
    roadmap: { ...EN.roadmap, title: 'Yol Haritası', p1t: 'Lansman', p2t: 'Topluluk' },
    faq: { ...EN.faq, title: 'SSS', q2: 'Bu finansal tavsiye mi?', q3: 'Çiçek neden ağlıyor?', q4: 'Nasıl alırım?' },
    lore: { o1t: 'Köken', o1d: EN.lore.o1d, o2t: 'Maskot', o2d: EN.lore.o2d, o3t: 'Zincir', o3d: EN.lore.o3d, o4t: 'Uyarı', o4d: EN.lore.o4d },
    footer: { ...EN.footer, rights: 'Hak falan yok. İnsanlara zarar verilmedi (keşke).' },
    chat: { title: 'Ağlayan Çiçek AI', subtitle: 'Sor bir şey. Pişman ol.', placeholder: 'Çiçeğe sor...', send: 'Gönder', greeting: 'Merhaba. Seninle konuşmaya zorlanmış ağlayan bir çiçeğim.', suggestions: ['CA nedir?', 'Neden ağlıyorsun?', 'Ne zaman yükselir?', 'Güvenli mi?', 'Bir şaka yap'] },
    ui: { ...EN.ui, enterMainHead: 'ANA SAYFAYA GIR', enterMainDesc: 'Tam site, oyun, istatistikler, quiz.', terminalDesc: 'flowerOS. Komutlar. Saf misantropi.', terminalSoon: 'YAKINDA', chatHead: 'ÇIÇEKLE KONUŞ', chatDesc: 'Pişman AI. Sıfır small talk. Tam sohbet modu.', introFoot: 'Üç protokol. Sıfır insan. Sefaletini seç.', terminalMain: 'ANA SAYFA', terminalExit: 'ÇIKIŞ', fullChatSub: 'Bundan hep pişman', fullChatMain: 'ANA', fullChatClose: 'KAPAT', fullChatPlaceholder: 'Çiçeğe mesaj yaz...' },
  },
  es: { ...EN, nav: { ...EN.nav, buy: 'Comprar' }, hero: { ...EN.hero, tagline: 'Flor llorando. Moneda miserable. Holders felices.', copyCa: '📋 Copiar CA', playGame: '🎮 Jugar' }, ca: { ...EN.ca, title: 'Direccion del Contrato', sub: 'Copia, pega y evita a los humanos.', copy: 'Copiar', copied: '✓ Copiado!' }, howto: { ...EN.howto, title: 'Como Comprar' }, chat: { ...EN.chat, title: 'Flor Llorona AI', subtitle: 'Pregunta lo que sea. Arrepientete de todo.', placeholder: 'Preguntale a la flor...', send: 'Enviar', suggestions: ['Cual es la CA?', 'Por que lloras?', 'Wen moon?', 'Es seguro?', 'Cuentame un chiste'] }, ui: { ...EN.ui, enterMainHead: 'ENTRAR A LA PAGINA', terminalSoon: 'PROXIMAMENTE', chatHead: 'HABLAR CON LA FLOR', terminalMain: 'PAGINA', terminalExit: 'SALIR', fullChatClose: 'CERRAR' } },
  fr: { ...EN, nav: { ...EN.nav, buy: 'Acheter' }, hero: { ...EN.hero, tagline: 'Fleur en pleurs. Coin miserable. Holders heureux.', copyCa: '📋 Copier la CA', playGame: '🎮 Jouer' }, ca: { ...EN.ca, title: 'Adresse du Contrat', sub: 'Copiez, collez, evitez les humains.', copy: 'Copier', copied: '✓ Copie!' }, howto: { ...EN.howto, title: 'Comment Acheter' }, chat: { ...EN.chat, title: 'Fleur en Pleurs AI', subtitle: 'Demande tout. Regrette tout.', placeholder: 'Parle a la fleur...', send: 'Envoyer' }, ui: { ...EN.ui, enterMainHead: 'ENTRER', terminalSoon: 'BIENTOT', chatHead: 'PARLER A LA FLEUR', terminalExit: 'QUITTER', fullChatClose: 'FERMER' } },
  de: { ...EN, nav: { ...EN.nav, buy: 'Kaufen' }, hero: { ...EN.hero, tagline: 'Weinende Blume. Elender Coin. Gluckliche Holder.', copyCa: '📋 CA Kopieren', playGame: '🎮 Spiel Starten' }, ca: { ...EN.ca, title: 'Contract-Adresse', sub: 'Kopieren, einfugen, Menschen meiden.', copy: 'Kopieren', copied: '✓ Kopiert!' }, howto: { ...EN.howto, title: 'So kaufst du' }, chat: { ...EN.chat, title: 'Weinende Blume AI', subtitle: 'Frag irgendwas. Bereue alles.', placeholder: 'Frag die Blume...', send: 'Senden' }, ui: { ...EN.ui, enterMainHead: 'HAUPTSEITE', terminalSoon: 'KOMMT BALD', chatHead: 'MIT BLUME REDEN' } },
  ja: { ...EN, nav: { quiz: 'クイズ', game: 'ゲーム', buy: '購入', chat: 'チャット' }, hero: { ...EN.hero, tagline: '泣く花。みじめなコイン。幸せなホルダー。', copyCa: '📋 CAをコピー', playGame: '🎮 ゲーム開始' }, stats: { ...EN.stats, chart: 'ライブ価格', price: '価格', mcap: '時価総額', volume: '24時間出来高', holders: '24時間取引', liquidity: '流動性' }, ca: { ...EN.ca, title: 'コントラクトアドレス', sub: 'コピーして、貼り付けて、人類を避けろ。', copy: 'コピー', copied: '✓ コピー完了!' }, howto: { ...EN.howto, title: '買い方' }, chat: { ...EN.chat, title: '泣く花AI', subtitle: '何でも聞け。そして後悔しろ。', placeholder: '花に聞いて...', send: '送信' }, ui: { ...EN.ui, enterMainHead: 'メインページへ', terminalSoon: '近日公開', chatHead: '花と話す', terminalMain: 'メイン', terminalExit: '終了', fullChatClose: '閉じる' } },
  ko: { ...EN, nav: { quiz: '퀴즈', game: '게임', buy: '구매', chat: '채팅' }, hero: { ...EN.hero, tagline: '우는 꽃. 비참한 코인. 행복한 홀더.', copyCa: '📋 CA 복사', playGame: '🎮 게임 시작' }, ca: { ...EN.ca, title: '컨트랙트 주소', sub: '복사하고 붙여넣고 인간을 피해라.', copy: '복사', copied: '✓ 복사됨!' }, howto: { ...EN.howto, title: '구매 방법' }, chat: { ...EN.chat, title: '우는 꽃 AI', subtitle: '아무거나 물어봐. 그리고 후회해.', placeholder: '꽃에게 물어봐...', send: '보내기' }, ui: { ...EN.ui, enterMainHead: '메인 페이지', terminalSoon: '곧 제공', chatHead: '꽃과 대화', terminalMain: '메인', terminalExit: '종료', fullChatClose: '닫기' } },
  pt: { ...EN, nav: { ...EN.nav, buy: 'Comprar' }, hero: { ...EN.hero, tagline: 'Flor chorando. Moeda miseravel. Holders felizes.', copyCa: '📋 Copiar CA', playGame: '🎮 Jogar' }, ca: { ...EN.ca, title: 'Endereco do Contrato', sub: 'Copie, cole e evite humanos.', copy: 'Copiar', copied: '✓ Copiado!' }, howto: { ...EN.howto, title: 'Como Comprar' }, chat: { ...EN.chat, title: 'Flor Chorando AI', subtitle: 'Pergunte qualquer coisa. Arrependa-se de tudo.', placeholder: 'Pergunte para a flor...', send: 'Enviar' }, ui: { ...EN.ui, enterMainHead: 'ENTRAR', terminalSoon: 'EM BREVE', chatHead: 'FALAR COM A FLOR', terminalMain: 'PAGINA', terminalExit: 'SAIR', fullChatClose: 'FECHAR' } },
  ar: { ...EN, nav: { quiz: 'اختبار', game: 'لعبة', buy: 'شراء', chat: 'دردشة' }, hero: { ...EN.hero, tagline: 'زهرة باكية. عملة بائسة. حاملوها سعداء.', copyCa: '📋 انسخ CA', playGame: '🎮 العب' }, stats: { ...EN.stats, chart: 'السعر المباشر', price: 'السعر', mcap: 'القيمة السوقية', volume: 'حجم 24 ساعة', holders: 'صفقات 24 ساعة', liquidity: 'السيولة' }, ca: { ...EN.ca, title: 'عنوان العقد', sub: 'انسخ والصق وابتعد عن البشر.', copy: 'انسخ', copied: '✓ تم النسخ!' }, howto: { ...EN.howto, title: 'كيفية الشراء' }, roadmap: { ...EN.roadmap, title: 'خارطة الطريق' }, faq: { ...EN.faq, title: 'الاسئلة الشائعة' }, chat: { ...EN.chat, title: 'الزهرة الباكية AI', subtitle: 'اسال اي شيء ثم اندم.', placeholder: 'اسال الزهرة...', send: 'ارسال' }, ui: { ...EN.ui, enterMainHead: 'الصفحة الرئيسية', terminalSoon: 'قريبا', chatHead: 'تحدث مع الزهرة', terminalMain: 'الرئيسية', terminalExit: 'خروج', fullChatClose: 'اغلاق' } },
  ru: { ...EN, nav: { quiz: 'Квиз', game: 'Игра', buy: 'Купить', chat: 'Чат' }, hero: { ...EN.hero, tagline: 'Плачущий цветок. Жалкая монета. Счастливые холдеры.', copyCa: '📋 Копировать CA', playGame: '🎮 Играть' }, ca: { ...EN.ca, title: 'Адрес Контракта', sub: 'Скопируй, вставь и избегай людей.', copy: 'Копировать', copied: '✓ Скопировано!' }, howto: { ...EN.howto, title: 'Как купить' }, roadmap: { ...EN.roadmap, title: 'Дорожная карта' }, chat: { ...EN.chat, title: 'Плачущий Цветок AI', subtitle: 'Спроси что угодно. Пожалей обо всем.', placeholder: 'Напиши цветку...', send: 'Отправить' }, ui: { ...EN.ui, enterMainHead: 'ГЛАВНАЯ', terminalSoon: 'СКОРО', chatHead: 'ГОВОРИТЬ С ЦВЕТКОМ', terminalMain: 'ГЛАВНАЯ', terminalExit: 'ВЫХОД', fullChatClose: 'ЗАКРЫТЬ' } },
};

class I18nController {
  constructor() {
    const stored = this.getStoredLang();
    this.lang = T[stored] ? stored : 'en';
  }

  getStoredLang() {
    try {
      return localStorage.getItem('lang') || localStorage.getItem('baton_lang') || 'en';
    } catch {
      return 'en';
    }
  }

  storeLang(code) {
    try {
      localStorage.setItem('lang', code);
      localStorage.setItem('baton_lang', code);
    } catch {
      // Ignore storage failures.
    }
  }

  t(path) {
    const keys = path.split('.');
    let value = T[this.lang];
    for (const key of keys) value = value?.[key];
    if (value === undefined) {
      value = T.en;
      for (const key of keys) value = value?.[key];
    }
    return value ?? path;
  }

  get buttons() {
    return this.t('buttons') || T.en.buttons;
  }

  get langInfo() {
    return LANGS.find((lang) => lang.code === this.lang) || LANGS[0];
  }

  setLanguage(code) {
    this.setLang(code);
  }

  setLang(code) {
    if (!T[code]) code = 'en';
    this.lang = code;
    this.storeLang(code);
    document.documentElement.lang = code;
    document.documentElement.dir = code === 'ar' ? 'rtl' : 'ltr';
    document.title = this.t('metaTitle');
    document.querySelector('meta[name="description"]')?.setAttribute('content', this.t('metaDesc'));
    this.apply();
    window.dispatchEvent(new CustomEvent('langchange', { detail: code }));
  }

  apply() {
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const value = this.t(el.dataset.i18n);
      if (Array.isArray(value)) {
        el.textContent = value.join(' · ');
      } else if (typeof value === 'string') {
        el.textContent = value;
      }
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
      const value = this.t(el.dataset.i18nPlaceholder);
      if (typeof value === 'string') el.setAttribute('placeholder', value);
    });

    const ticker = document.querySelector('.ticker-track');
    if (ticker) {
      const items = this.t('ticker') || T.en.ticker;
      ticker.innerHTML = [...items, ...items].map((item) => `<span>${item}</span>`).join('');
    }

    const langBtn = document.getElementById('langCurrent');
    if (langBtn) {
      const info = this.langInfo;
      langBtn.innerHTML = `${info.flag} ${info.nativeName || info.name}`;
    }
  }
}

window.I18n = new I18nController();
window.LANGS = LANGS;
window.CA = CA;
window.T = T;
window.setLanguage = (lang) => window.I18n.setLanguage(lang);
