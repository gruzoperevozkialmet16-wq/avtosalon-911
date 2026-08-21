/* ==========================================================================
   Автосалон 911 — фронтенд главной страницы
   ========================================================================== */
(function () {
  'use strict';

  var TG = 'https://t.me/Vandr_AM';
  var MAX = 'https://max.ru/join/HBsn5LjCstFD8546mRrOXGchu4H7MfQ1rc7fV7HKlq8';
  var PHONE = '+79178997267';

  /* ---------- Год в футере ---------- */
  var y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();

  /* ---------- Бургер / мобильное меню ---------- */
  var burger = document.getElementById('burger');
  var mobileMenu = document.getElementById('mobileMenu');
  if (burger && mobileMenu) {
    burger.addEventListener('click', function () {
      burger.classList.toggle('active');
      mobileMenu.classList.toggle('open');
    });
    mobileMenu.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        burger.classList.remove('active');
        mobileMenu.classList.remove('open');
      });
    });
  }

  /* ---------- Reveal при скролле ---------- */
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });

  /* ---------- Тосты ---------- */
  function toast(msg, ok) {
    var wrap = document.getElementById('toastWrap');
    if (!wrap) return alert(msg);
    var t = document.createElement('div');
    t.className = 'toast' + (ok ? ' toast--ok' : '');
    t.textContent = msg;
    wrap.appendChild(t);
    setTimeout(function () { t.style.opacity = '0'; t.style.transition = 'opacity .4s'; setTimeout(function () { t.remove(); }, 400); }, 4200);
  }

  /* ---------- Превью каталога (первые 6) ---------- */
  var previewGrid = document.getElementById('previewGrid');
  if (previewGrid && window.Store) {
    Store.ready.then(function () { return Store.listCars(); }).then(function (cars) {
      previewGrid.innerHTML = cars.filter(function (c) { return !c.sold; }).slice(0, 6).map(carCardHTML).join('');
      previewGrid.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });
    });
  }

  function carCardHTML(c) {
    var img = (c.images && c.images[0]) || Store.PLACEHOLDER((c.brand || 'АВТО'), '');
    var specs = [
      c.year ? c.year + ' г.' : '',
      c.mileage ? Store.formatKm(c.mileage) : '',
      c.transmission || '',
      c.engine || ''
    ].filter(Boolean).map(function (s) { return '<span class="spec">' + s + '</span>'; }).join('');
    var tag = c.featured ? '<span class="car-card__tag car-card__tag--hot">🔥 Хит</span>' : '<span class="car-card__tag">В наличии</span>';
    var sold = c.sold ? '<div class="car-card__sold"><span>Продано</span></div>' : '';
    return '' +
      '<article class="car-card reveal">' +
      '<div class="car-card__media">' + tag + sold + '<img src="' + img + '" alt="' + escapeAttr((c.brand || '') + ' ' + (c.model || '')) + '" loading="lazy" /></div>' +
      '<div class="car-card__body">' +
      '<div class="car-card__title">' + escapeHtml([c.brand, c.model].filter(Boolean).join(' ')) + '</div>' +
      '<div class="car-card__price">' + Store.formatPrice(c.price) + '</div>' +
      '<div class="car-card__specs">' + specs + '</div>' +
      (c.description ? '<p class="car-card__desc">' + escapeHtml(c.description) + '</p>' : '') +
      '<div class="car-card__foot">' +
      '<a href="tel:' + PHONE + '" class="btn btn--primary" style="flex:1">Позвонить</a>' +
      '<a href="' + MAX + '" target="_blank" rel="noopener" class="btn btn--ghost">Написать</a>' +
      '</div></div></article>';
  }

  /* ---------- Галерея счастливых покупателей ---------- */
  var media = [
    { type: 'img', src: 'assets/media/customers/customer-01.jpg', cls: 'gallery__item--tall' },
    { type: 'video', src: 'assets/media/customers/customer-video-1.mp4' },
    { type: 'img', src: 'assets/media/customers/customer-02.jpg' },
    { type: 'img', src: 'assets/media/customers/customer-03.jpg' },
    { type: 'img', src: 'assets/media/customers/customer-04.jpg', cls: 'gallery__item--tall' },
    { type: 'img', src: 'assets/media/customers/customer-05.jpg' },
    { type: 'video', src: 'assets/media/customers/customer-video-2.mp4' },
    { type: 'img', src: 'assets/media/customers/customer-06.jpg' },
    { type: 'img', src: 'assets/media/customers/customer-07.jpg', cls: 'gallery__item--wide' },
    { type: 'img', src: 'assets/media/customers/customer-08.jpg' },
    { type: 'img', src: 'assets/media/customers/customer-09.jpg', cls: 'gallery__item--tall' },
    { type: 'img', src: 'assets/media/customers/customer-10.jpg' },
    { type: 'img', src: 'assets/media/customers/customer-11.jpg' },
    { type: 'img', src: 'assets/media/customers/customer-12.jpg' }
  ];
  var gallery = document.getElementById('gallery');
  if (gallery) {
    gallery.innerHTML = media.map(function (m, i) {
      var badge = '<span class="gallery__badge">🎀 Новый владелец</span>';
      if (m.type === 'video') {
        return '<div class="gallery__item ' + (m.cls || '') + '" data-lb="' + i + '" data-type="video" data-src="' + m.src + '">' +
          '<video src="' + m.src + '#t=0.1" muted playsinline preload="metadata"></video>' +
          '<div class="gallery__play"><span></span></div>' + badge + '</div>';
      }
      return '<div class="gallery__item ' + (m.cls || '') + '" data-lb="' + i + '" data-type="img" data-src="' + m.src + '">' +
        '<img src="' + m.src + '" alt="Счастливый покупатель Автосалон 911" loading="lazy" />' + badge + '</div>';
    }).join('');
  }

  /* ---------- Отзывы (примеры — заменяются реальными по ссылкам Я.Карт/2ГИС) ---------- */
  var reviews = [
    { name: 'Айдар Г.', src: '2ГИС', badge: 'gis', color: '#2ca86a', rating: 5, text: 'Брал Renault Duster. Всё чётко, без обмана: показали историю, дали проверить на подъёмнике. Оформили кредит за день. Рекомендую!' },
    { name: 'Марина В.', src: 'Яндекс.Карты', badge: 'ya', color: '#e11d2a', rating: 5, text: 'Продавала свою машину под комиссию — продали дороже, чем я рассчитывала. Спасибо за честность и постоянную связь по телефону.' },
    { name: 'Ильназ С.', src: '2ГИС', badge: 'gis', color: '#3a7bd5', rating: 5, text: 'Выкупили мой авто за 30 минут, деньги сразу на карту. Приятные ребята, красный бант на новую машину — жене очень понравилось 😄' },
    { name: 'Дмитрий К.', src: 'Яндекс.Карты', badge: 'ya', color: '#d4761e', rating: 5, text: 'Взял BMW в отличном состоянии. По телефону всё рассказали, приехал — так и есть. Трейд‑ин сделали быстро, доплата адекватная.' },
    { name: 'Регина Ф.', src: '2ГИС', badge: 'gis', color: '#8e44ad', rating: 5, text: 'Первый автомобиль брала здесь. Помогли с автокредитом, всё объяснили спокойно и по‑человечески. Машина радует до сих пор!' },
    { name: 'Артём Н.', src: 'Яндекс.Карты', badge: 'ya', color: '#16a085', rating: 5, text: 'Честный автосалон, каких мало. Не впаривают, отвечают на все вопросы. Купил Kia Rio, полет нормальный. 5 звёзд заслуженно.' }
  ];
  var reviewsGrid = document.getElementById('reviewsGrid');
  if (reviewsGrid) {
    reviewsGrid.innerHTML = reviews.map(function (r) {
      var stars = '★★★★★'.slice(0, r.rating) + '☆☆☆☆☆'.slice(0, 5 - r.rating);
      return '<article class="review-card reveal">' +
        '<div class="review-card__top">' +
        '<div class="review-card__ava" style="background:' + r.color + '">' + escapeHtml(r.name.charAt(0)) + '</div>' +
        '<div><div class="review-card__name">' + escapeHtml(r.name) + '</div>' +
        '<div class="review-card__src"><span class="review-badge review-badge--' + r.badge + '">' + escapeHtml(r.src) + '</span></div></div>' +
        '<div class="stars" style="margin-left:auto">' + stars + '</div></div>' +
        '<p class="review-card__text">' + escapeHtml(r.text) + '</p>' +
        '</article>';
    }).join('');
    // повторно наблюдаем новые .reveal
    reviewsGrid.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });
  }

  /* ---------- Лайтбокс ---------- */
  var lb = document.getElementById('lightbox');
  var lbContent = document.getElementById('lbContent');
  var lbClose = document.getElementById('lbClose');
  var lbPrev = document.getElementById('lbPrev');
  var lbNext = document.getElementById('lbNext');
  var lbIndex = 0;
  var lbItems = media;

  function openLB(i) {
    lbIndex = (i + lbItems.length) % lbItems.length;
    var m = lbItems[lbIndex];
    lbContent.innerHTML = m.type === 'video'
      ? '<video src="' + m.src + '" controls autoplay playsinline></video>'
      : '<img src="' + m.src + '" alt="Счастливый покупатель Автосалон 911" />';
    lb.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closeLB() { lb.classList.remove('open'); lbContent.innerHTML = ''; document.body.style.overflow = ''; }

  if (gallery) {
    gallery.addEventListener('click', function (e) {
      var item = e.target.closest('.gallery__item');
      if (item) openLB(parseInt(item.getAttribute('data-lb'), 10));
    });
  }
  lbClose && lbClose.addEventListener('click', closeLB);
  lbPrev && lbPrev.addEventListener('click', function () { openLB(lbIndex - 1); });
  lbNext && lbNext.addEventListener('click', function () { openLB(lbIndex + 1); });
  lb && lb.addEventListener('click', function (e) { if (e.target === lb) closeLB(); });
  document.addEventListener('keydown', function (e) {
    if (!lb || !lb.classList.contains('open')) return;
    if (e.key === 'Escape') closeLB();
    if (e.key === 'ArrowLeft') openLB(lbIndex - 1);
    if (e.key === 'ArrowRight') openLB(lbIndex + 1);
  });

  /* ---------- Форма выкупа → Telegram ---------- */
  var form = document.getElementById('buyoutForm');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var f = new FormData(form);
      var text = 'Заявка на ВЫКУП авто (сайт Автосалон 911):\n' +
        'Имя: ' + (f.get('name') || '—') + '\n' +
        'Телефон: ' + (f.get('phone') || '—') + '\n' +
        'Авто: ' + (f.get('car') || '—') + ', ' + (f.get('year') || '—') + ' г.\n' +
        'Комментарий: ' + (f.get('comment') || '—');
      function openMax() { window.open(MAX, '_blank'); }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () {
          toast('Заявка скопирована — вставьте её в чат MAX. Или позвоните: 8 917 899‑72‑67', true);
          openMax();
        }, function () {
          toast('Открываем MAX. Или позвоните: 8 917 899‑72‑67', true); openMax();
        });
      } else {
        toast('Открываем MAX. Или позвоните: 8 917 899‑72‑67', true); openMax();
      }
      form.reset();
    });
  }

  /* ---------- Хелперы ---------- */
  function escapeHtml(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function escapeAttr(s) { return escapeHtml(s).replace(/"/g, '&quot;'); }
})();
