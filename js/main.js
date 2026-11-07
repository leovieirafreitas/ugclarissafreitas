const toggle = document.querySelector('.nav__toggle');
const nav = document.querySelector('.nav');
toggle.addEventListener('click', () => {
  const open = nav.classList.toggle('is-open');
  toggle.setAttribute('aria-expanded', open);
});

/* ===== Animações ao rolar a página ===== */
(function () {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || !('IntersectionObserver' in window)) { window.revealIn = () => {}; return; }

  // [seletor, tipo de animação, atraso em cascata entre irmãos (ms)]
  const targets = [
    ['.about__dots, .about__title', 'up', 0],
    ['.about__content p', 'up', 90],
    ['.about__tags li', 'up', 70],
    ['.about__photo', 'right', 0],
    ['.niches__title', 'up', 0],
    ['.niches__content p, .niches__content .btn', 'up', 120],
    ['.niche', 'left', 80],
    ['.niches__photo', 'zoom', 0],
    ['.feed__title', 'up', 0],
    ['.feed__bar', 'up', 0],
    ['.feed__tiktok', 'up', 0],
    ['.contact__title, .contact__lead', 'up', 120],
    ['.contact__list > li', 'up', 100],
    ['.site-footer', 'fade', 0],
  ];

  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('is-visible'); io.unobserve(e.target); }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });

  function prep(el, type, i, step) {
    if (el.classList.contains('reveal')) return;
    el.classList.add('reveal', 'reveal--' + type);
    el.style.setProperty('--reveal-delay', (i * step) + 'ms');
    // depois que aparecer, devolve as transições originais (hover etc.)
    const done = e => {
      if (e.target !== el) return;
      if (e.propertyName !== 'transform' && type !== 'fade') return;
      el.removeEventListener('transitionend', done);
      el.classList.remove('reveal', 'reveal--' + type, 'is-visible');
      el.style.removeProperty('--reveal-delay');
    };
    el.addEventListener('transitionend', done);
    io.observe(el);
  }

  targets.forEach(([sel, type, step]) => {
    document.querySelectorAll(sel).forEach((el, i) => prep(el, type, step ? i : 0, step));
  });

  // reforço: revela tudo que já entrou ou passou da tela (rolagem rápida)
  let ticking = false;
  const sweep = () => {
    ticking = false;
    const limit = window.innerHeight * 0.92;
    document.querySelectorAll('.reveal:not(.is-visible)').forEach(el => {
      if (el.getBoundingClientRect().top < limit) { el.classList.add('is-visible'); io.unobserve(el); }
    });
  };
  window.addEventListener('scroll', () => { if (!ticking) { ticking = true; setTimeout(sweep, 60); } }, { passive: true });
  window.addEventListener('load', sweep);

  // para conteúdo carregado depois (posts do Instagram)
  window.revealIn = root => {
    root.querySelectorAll('.post, .feed__empty').forEach((el, i) => prep(el, 'up', i, 90));
  };
})();

/* ===== Feed do Instagram (atualiza sozinho) =====
   1. Crie uma conta grátis em https://behold.so e conecte o Instagram @larissafreitasoficial
   2. Crie um feed do tipo "JSON" e copie o ID do feed (ex.: "aBc123XyZ")
   3. Cole o ID abaixo, entre as aspas. Pronto: os posts novos aparecem aqui automaticamente. */
const BEHOLD_FEED_ID = 'FwjxmdZgJn7j9zrTOe6N';
const IG_PROFILE = 'https://www.instagram.com/larissafreitasoficial/';
const IG_MAX_POSTS = 4;

(function loadInstagram() {
  const grid = document.getElementById('ig-feed');
  const fallback = () => {
    grid.classList.add('feed__grid--empty');
    grid.innerHTML = `
      <a class="feed__empty" href="${IG_PROFILE}" target="_blank" rel="noopener">
        <span class="feed__empty-title">Acompanhe meus conteúdos no Instagram</span>
        <span class="feed__empty-cta">Abrir @larissafreitasoficial →</span>
      </a>`;
    if (window.revealIn) window.revealIn(grid);
  };
  if (!BEHOLD_FEED_ID) return fallback();

  const fmt = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  const esc = s => String(s || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  fetch('https://feeds.behold.so/' + encodeURIComponent(BEHOLD_FEED_ID))
    .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(data => {
      const posts = (Array.isArray(data) ? data : data.posts || []).slice(0, IG_MAX_POSTS);
      if (!posts.length) return fallback();
      grid.innerHTML = posts.map(p => {
        const img = (p.sizes && p.sizes.medium && p.sizes.medium.mediaUrl) || p.thumbnailUrl || p.mediaUrl;
        const caption = (p.prunedCaption || p.caption || '').trim();
        const date = p.timestamp ? fmt.format(new Date(p.timestamp)).replace(/\./g, '').replace(/ de /g, ' ') : '';
        const isVideo = p.mediaType === 'VIDEO';
        return `
          <a class="post" href="${esc(p.permalink || IG_PROFILE)}" target="_blank" rel="noopener">
            <span class="post__media">
              <img src="${esc(img)}" alt="${esc(caption.slice(0, 100)) || 'Post do Instagram'}" loading="lazy">
              ${isVideo ? '<span class="post__badge" aria-label="Vídeo">▶</span>' : ''}
            </span>
            <span class="post__date">${esc(date)}</span>
            <span class="post__caption">${esc(caption)}</span>
          </a>`;
      }).join('');
      if (window.revealIn) window.revealIn(grid);
    })
    .catch(fallback);
})();

/* ===== TikTok =====
   O player oficial do TikTok (perfil) vive sendo bloqueado ("overload-protect").
   Por isso o site mostra CARTÕES dos vídeos listados abaixo — estável e sem bloqueio.
   Para trocar os vídeos: cole os links no formato https://www.tiktok.com/@larisantosdefreitas/video/123...
   Deixe a lista vazia para usar o player oficial (menos confiável). */
const TIKTOK_VIDEOS = [
  'https://www.tiktok.com/@larisantosdefreitas/video/7705246832955247892',
  'https://www.tiktok.com/@larisantosdefreitas/video/7704106690777517333',
  'https://www.tiktok.com/@larisantosdefreitas/video/7701738378722544916',
  'https://www.tiktok.com/@larisantosdefreitas/video/7701349053161803028',
];
const TT_PROFILE = 'https://www.tiktok.com/@larisantosdefreitas';

(function loadTikTok() {
  const grid = document.getElementById('tt-feed');
  const embedBox = document.querySelector('.feed__tiktok');
  const note = document.querySelector('.feed__note');
  const esc = s => String(s || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const useEmbed = () => {
    grid.hidden = true; embedBox.hidden = false; note.hidden = false;
    let loaded = false;
    const load = () => {
      if (loaded) return; loaded = true;
      const s = document.createElement('script');
      s.src = 'https://www.tiktok.com/embed.js'; s.async = true;
      document.body.appendChild(s);
    };
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { load(); io.disconnect(); } }, { rootMargin: '600px 0px' });
      io.observe(embedBox);
    } else { load(); }
    setTimeout(load, 8000);
  };

  if (!TIKTOK_VIDEOS.length) return useEmbed();

  // player oficial por vídeo (estável, sem o bloqueio do player de perfil)
  const ids = TIKTOK_VIDEOS.map(u => (String(u).match(/video\/(\d+)/) || [])[1]).filter(Boolean).slice(0, 8);
  if (!ids.length) return useEmbed();
  embedBox.hidden = true; note.hidden = true; grid.hidden = false;
  grid.classList.add('feed__grid--tt');
  const params = 'controls=1&progress_bar=1&play_button=1&volume_control=1&fullscreen_button=1&timestamp=0&loop=0&music_info=0&description=0&rel=0&native_context_menu=1&closed_caption=1';
  grid.innerHTML = ids.map((id, i) => `
    <div class="post post--video">
      <span class="post__media post__media--tall post__media--player">
        <iframe src="https://www.tiktok.com/player/v1/${id}?${params}" title="Vídeo ${i + 1} no TikTok"
          allow="encrypted-media; fullscreen; picture-in-picture" allowfullscreen loading="lazy"></iframe>
      </span>
      <a class="post__date" href="${TT_PROFILE}/video/${id}" target="_blank" rel="noopener">Ver no TikTok →</a>
    </div>`).join('');
  if (window.revealIn) window.revealIn(grid);
})();
